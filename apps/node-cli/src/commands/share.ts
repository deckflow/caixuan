import { Command } from 'commander';
import chalk from 'chalk';
import { Context } from '../context.js';
import { collect, parsePositiveInteger, readJsonBody } from '../utils/parse.js';

export function registerShareCommands(program: Command, ctx: Context): void {
  const share = program.command('share').description('Manage shares in the current space');

  share
    .command('list')
    .description('List shares in the current space')
    .option('--start <n>', 'Pagination start index', '0')
    .option('--limit <n>', 'Max results', '20')
    .addHelpText('after', '\nExample:\n  $ caixuan share list --json')
    .action(async (options: { start: string; limit: string }) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const result = await client.shares.list(undefined, {
          _startIndex: parsePositiveInteger(options.start, '--start'),
          _maxResults: parsePositiveInteger(options.limit, '--limit'),
        });
        ctx.output(result, undefined, { count: result.count });
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
    .option('--body <json>', 'Full JSON body or @file.json')
    .addHelpText('after', '\nExample:\n  $ caixuan share update share123 --name "New name"')
    .action(async (shareId: string, options: { name?: string; description?: string; body?: string }) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const payload = options.body
          ? await readJsonBody(options.body)
          : {
              ...(options.name ? { name: options.name } : {}),
              ...(options.description ? { description: options.description } : {}),
            };

        if (!options.body && !options.name && !options.description) {
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
