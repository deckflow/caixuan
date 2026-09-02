import { Command, Option } from 'commander';
import chalk from 'chalk';
import { Context } from '../context.js';
import { outputListResult, SHARE_COLUMNS } from '../utils/list-format.js';
import { collect, collectIntegers, parsePositiveInteger, readJsonBody } from '../utils/parse.js';
import { buildShareModifyPayload, hasShareModifyFields, type ShareModifyCliOptions } from '../utils/share-payload.js';

export function registerShareCommands(program: Command, ctx: Context): void {
  const share = program.command('share').description('Manage shares in the current space');

  share
    .command('list')
    .description('List shares in the current space')
    .option('--start <n>', 'Pagination start index', '0')
    .option('--limit <n>', 'Max results', '20')
    .option('--table', 'Output as a table')
    .addHelpText('after', '\nExamples:\n  $ caixuan share list\n  $ caixuan share list --table\n  $ caixuan share list --json')
    .action(async (options: { start: string; limit: string; table?: boolean }) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const result = await client.shares.list(undefined, {
          _startIndex: parsePositiveInteger(options.start, '--start'),
          _maxResults: parsePositiveInteger(options.limit, '--limit'),
        });
        outputListResult(ctx, result, SHARE_COLUMNS, {
          table: options.table,
          emptyMessage: 'No shares found.',
          start: parsePositiveInteger(options.start, '--start'),
        });
      } catch (error) {
        ctx.error(error);
      }
    });

  share
    .command('get <share-id>')
    .description('Get share details')
    .option('--include <fields>', 'Comma-separated includes, e.g. creator')
    .action(async (shareId: string, options: { include?: string }) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const includes = options.include?.split(',').map((s) => s.trim()).filter(Boolean);
        const detail = await client.shares.get(shareId, includes);
        ctx.output(detail);
      } catch (error) {
        ctx.error(error);
      }
    });

  share
    .command('create')
    .description('Create a share in the current space')
    .requiredOption('--name <name>', 'Share name')
    .option('--description <text>', 'Share description')
    .option('--doc <doc-id>', 'Attach a document to the share', collect, [])
    .option('--view-control <mode>', 'View control mode')
    .option('--password <password>', 'Share password (max 4 chars)')
    .option('--need-phone <yes|no>', 'Require phone number')
    .option('--body <json>', 'Full JSON body or @file.json')
    .addHelpText(
      'after',
      `
Examples:
  $ caixuan share create --name "My share" --doc doc12345
  $ caixuan share create --name "Complex" --body @share.json`
    )
    .action(
      async (options: {
        name: string;
        description?: string;
        doc?: string[];
        viewControl?: string;
        password?: string;
        needPhone?: 'yes' | 'no';
        body?: string;
      }) => {
        try {
          ctx.requireAuth();
          const client = await ctx.getClient();
          const spaceId = await client.spaces.get().then((s) => s.id);

          let payload: Record<string, unknown> = options.body
            ? await readJsonBody(options.body)
            : {
                name: options.name,
                ...(options.description ? { description: options.description } : {}),
                ...(options.viewControl ? { viewControl: options.viewControl } : {}),
                ...(options.password ? { password: options.password } : {}),
                ...(options.needPhone ? { needPhone: options.needPhone } : {}),
              };

          if (!options.body) {
            if (options.doc && options.doc.length > 0) {
              payload.content = options.doc.map((id) => ({ _type: 'doc', id }));
            }
          }

          const created = await client.shares.create({ spaceId, ...payload } as never);
          ctx.output(created, () => chalk.green('✓ Share created'));
        } catch (error) {
          ctx.error(error);
        }
      }
    );

  share
    .command('update <share-id>')
    .description('Update a share')
    .option('--name <name>', 'Share name')
    .option('--description <text>', 'Share description')
    .option('--is-secrecy <yes|no>', 'Whether the share is secret')
    .option('--notice-user-id <id>', 'User ID to notify (repeatable)', collect, [] as string[])
    .option('--consumer-tag <n>', 'Consumer tag ID (repeatable)', collectIntegers, [] as number[])
    .option('--need-phone <yes|no>', 'Require phone number')
    .option('--single-link-view-limit <n>', 'Max viewers per link (0 = unlimited)')
    .option('--password <password>', 'Share password (max 4 chars)')
    .addOption(
      new Option('--download <mode>', 'Download permission').choices(['notAllowed', 'pdf', 'pptx', 'pdfPptx'])
    )
    .option('--allow-viewer-share <yes|no>', 'Allow viewers to share')
    .option('--allow-search-engine-index <yes|no>', 'Allow search engine indexing')
    .addOption(new Option('--watermark <mode>', 'Watermark mode').choices(['none', 'user', 'viewer', 'both']))
    .option('--file-watermark <text>', 'File watermark text')
    .option('--watermark-color <color>', 'Watermark text color')
    .option('--expired-at <iso|null>', 'Expiration time (ISO 8601) or "null" to clear')
    .option('--allow-leave-contact <yes|no>', 'Allow viewers to leave contact info')
    .addOption(
      new Option('--contact-type <type>', 'Contact collection type').choices(['none', 'mobile', 'email', 'wechat'])
    )
    .addOption(
      new Option('--view-control <mode>', 'View control mode').choices([
        'none',
        'contact',
        'buy',
        'password',
        'consumer',
      ])
    )
    .option('--price <cents>', 'Price in smallest currency unit')
    .option('--paid-interval <json>', 'Paid access interval JSON, e.g. {"unit":"month","value":1}, or "null"')
    .option('--public-buyer-and-message <yes|no>', 'Show buyers and featured messages publicly')
    .option('--content <json>', 'Full content array JSON')
    .option('--doc <doc-id>', 'Attach a document to the share (repeatable)', collect, [] as string[])
    .option('--overseas-cdn <yes|no>', 'Enable overseas CDN acceleration')
    .option('--body <json>', 'Full JSON body or @file.json')
    .addHelpText(
      'after',
      `
Examples:
  $ caixuan share update share123 --name "New name"
  $ caixuan share update share123 --view-control password --password 1234
  $ caixuan share update share123 --body @share.json`
    )
    .action(async (shareId: string, options: ShareModifyCliOptions & { body?: string }) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const payload = options.body ? await readJsonBody(options.body) : buildShareModifyPayload(options);

        if (!options.body && !hasShareModifyFields(payload)) {
          ctx.error('Provide at least one field or --body', 'INVALID_ARGS');
        }

        const updated = await client.shares.update({ id: shareId, ...payload });
        ctx.output(updated, () => chalk.green('✓ Share updated'));
      } catch (error) {
        ctx.error(error);
      }
    });

  share
    .command('delete <share-id>')
    .description('Delete a share')
    .action(async (shareId: string) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        await client.shares.delete(shareId);
        ctx.output({ id: shareId, deleted: true }, () => chalk.green('✓ Share deleted'));
      } catch (error) {
        ctx.error(error);
      }
    });
}
