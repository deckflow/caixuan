import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve as resolvePath } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Command } from 'commander';
import chalk from 'chalk';
import { Context } from '../context.js';
import { DOC_COLUMNS, outputListResult } from '../utils/list-format.js';
import { parsePositiveInteger, readJsonBody } from '../utils/parse.js';

export function registerDocCommands(program: Command, ctx: Context): void {
  const doc = program.command('doc').description('Manage documents in the current space');

  doc
    .command('list')
    .description('List documents in the current space')
    .option('--start <n>', 'Pagination start index', '0')
    .option('--limit <n>', 'Max results', '20')
    .option('--name <keyword>', 'Filter by name (fuzzy search)')
    .option('--folder-id <id>', 'Parent folder ID')
    .option('--my', 'List via space.docs instead of space.ownDocs')
    .option('--table', 'Output as a table')
    .addHelpText(
      'after',
      '\nExamples:\n  $ caixuan doc list\n  $ caixuan doc list --my\n  $ caixuan doc list --name report\n  $ caixuan doc list --table\n  $ caixuan doc list --json'
    )
    .action(async (options: {
      start: string;
      limit: string;
      name?: string;
      folderId?: string;
      my?: boolean;
      table?: boolean;
    }) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const listParams = {
          _startIndex: parsePositiveInteger(options.start, '--start'),
          _maxResults: parsePositiveInteger(options.limit, '--limit'),
          name: options.name,
          ...(options.folderId !== undefined ? { folderId: options.folderId } : {}),
        };
        let useMy = Boolean(options.my);
        let result = await client.docs.list(undefined, { ...listParams, my: useMy });
        // Empty result: toggle --my once and retry
        if (result.count === 0) {
          useMy = !useMy;
          result = await client.docs.list(undefined, { ...listParams, my: useMy });
        }
        outputListResult(ctx, result, DOC_COLUMNS, {
          table: options.table,
          emptyMessage: 'No documents found.',
          start: parsePositiveInteger(options.start, '--start'),
        });
      } catch (error) {
        ctx.error(error);
      }
    });

  doc
    .command('get <doc-id>')
    .description('Get document details')
    .option('--include <fields>', 'Comma-separated includes, e.g. creator,shares')
    .action(async (docId: string, options: { include?: string }) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const includes = options.include?.split(',').map((s) => s.trim()).filter(Boolean);
        const detail = await client.docs.get(docId, includes);
        ctx.output(detail);
      } catch (error) {
        ctx.error(error);
      }
    });

  doc
    .command('create')
    .description('Upload a file and create a document')
    .requiredOption('--file <path>', 'Path to the file to upload')
    .option('--name <name>', 'Document name (defaults to file name)')
    .option('--folder-id <id>', 'Parent folder ID', '')
    .option('--zone <n>', 'Zone number', '-1')
    .addHelpText(
      'after',
      `
Example:
  $ caixuan doc create --file ./deck.pptx --name "Quarterly Review"`
    )
    .action(async (options: { file: string; name?: string; folderId?: string; zone: string }) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const space = await client.spaces.get();

        const spinner = ctx.createSpinner('Uploading file...');
        const uploaded = await client.files.upload(options.file, {
          spaceId: space.id,
          name: options.name,
          onProgress: (p) => {
            if (!ctx.jsonOutput) spinner.text = `Uploading file... ${(p * 100).toFixed(1)}%`;
          },
        });
        ctx.succeedSpinner(spinner, `Uploaded file ${uploaded.id}`);

        const parsedZone = Number.parseInt(options.zone, 10);
        const createSpinner = ctx.createSpinner('Creating document...');
        const created = await client.docs.create({
          spaceId: space.id,
          fileId: uploaded.id,
          name: options.name,
          folderId: options.folderId,
          zone: Number.isNaN(parsedZone) ? -1 : parsedZone,
        });
        ctx.succeedSpinner(createSpinner, 'Document created');
        ctx.output(created, () => chalk.green(`✓ Document created: ${(created as { id?: string }).id ?? ''}`));
      } catch (error) {
        ctx.error(error);
      }
    });

  doc
    .command('update <doc-id>')
    .description('Update a document (currently supports rename)')
    .option('--name <name>', 'New document name')
    .option('--body <json>', 'Full JSON body or @file.json')
    .addHelpText(
      'after',
      `
Examples:
  $ caixuan doc update doc123 --name "New title"
  $ caixuan doc update doc123 --body '{"name":"New title"}'`
    )
    .action(async (docId: string, options: { name?: string; body?: string }) => {
      try {
        ctx.requireAuth();
        const payload = options.body
          ? await readJsonBody(options.body)
          : { ...(options.name ? { name: options.name } : {}) };

        const name = payload.name;
        if (typeof name !== 'string' || !name) {
          ctx.error('Provide --name or --body with a "name" field', 'INVALID_ARGS');
        }

        const client = await ctx.getClient();
        const updated = await client.docs.rename(docId, name);
        ctx.output(updated, () => chalk.green('✓ Document updated'));
      } catch (error) {
        ctx.error(error);
      }
    });

  doc
    .command('delete <doc-id>')
    .description('Delete a document')
    .action(async (docId: string) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        await client.docs.delete(docId);
        ctx.output({ id: docId, deleted: true }, () => chalk.green('✓ Document deleted'));
      } catch (error) {
        ctx.error(error);
      }
    });

  doc
    .command('down <doc-id>')
    .description('Download the latest release of a document')
    .requiredOption('-o, --out <path>', 'Local file path to save the download')
    .addHelpText(
      'after',
      `
Example:
  $ caixuan doc down doc123 -o ./deck.pptx`
    )
    .action(async (docId: string, options: { out: string }) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const outPath = resolvePath(options.out);

        const spinner = ctx.createSpinner('Fetching latest release...');
        const release = await client.docs.release(docId, 'LATEST');
        const downloadUrl = release.path;
        if (typeof downloadUrl !== 'string' || !downloadUrl) {
          ctx.failSpinner(spinner, 'No download path');
          ctx.error('Latest release has no downloadable path (missing permission or file).', 'NOT_FOUND');
        }

        spinner.text = 'Downloading release...';
        await mkdir(dirname(outPath), { recursive: true });
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          ctx.failSpinner(spinner, 'Download failed');
          ctx.error(`Download failed with HTTP ${response.status}`, 'DOWNLOAD_FAILED');
        }
        if (!response.body) {
          ctx.failSpinner(spinner, 'Download failed');
          ctx.error('Download response has no body', 'DOWNLOAD_FAILED');
        }

        await pipeline(Readable.fromWeb(response.body), createWriteStream(outPath));
        ctx.succeedSpinner(spinner, 'Download complete');
        ctx.output({ path: outPath }, () => outPath);
      } catch (error) {
        ctx.error(error);
      }
    });
}
