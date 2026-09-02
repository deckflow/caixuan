import { Command, Option } from 'commander';
import chalk from 'chalk';
import { Context } from '../context.js';
import { MEMBER_COLUMNS, outputListResult } from '../utils/list-format.js';
import { parsePositiveInteger, readJsonBody } from '../utils/parse.js';

export function registerMemberCommands(program: Command, ctx: Context): void {
  const member = program.command('member').description('Manage members in the current space');

  member
    .command('list')
    .description('List members in the current space')
    .option('--start <n>', 'Pagination start index', '0')
    .option('--limit <n>', 'Max results', '20')
    .option('--table', 'Output as a table')
    .addHelpText('after', '\nExamples:\n  $ caixuan member list\n  $ caixuan member list --table\n  $ caixuan member list --json')
    .action(async (options: { start: string; limit: string; table?: boolean }) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const result = await client.members.list(undefined, {
          _startIndex: parsePositiveInteger(options.start, '--start'),
          _maxResults: parsePositiveInteger(options.limit, '--limit'),
        });
        outputListResult(ctx, result, MEMBER_COLUMNS, {
          table: options.table,
          emptyMessage: 'No members found.',
          start: parsePositiveInteger(options.start, '--start'),
        });
      } catch (error) {
        ctx.error(error);
      }
    });

  member
    .command('get <user-id>')
    .description('Get a space member details')
    .action(async (userId: string) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const detail = await client.members.get(undefined, userId);
        ctx.output(detail);
      } catch (error) {
        ctx.error(error);
      }
    });

  member
    .command('create')
    .description('Add a member to the current space')
    .addOption(
      new Option('--role <role>', 'Member role').choices(['manager', 'teammate', 'guest']).makeOptionMandatory()
    )
    .option('--user-id <id>', 'Existing user ID')
    .option('--mobile <mobile>', 'Mobile number')
    .option('--email <email>', 'Email address')
    .option('--name <name>', 'Display name in the space')
    .addHelpText(
      'after',
      `
Examples:
  $ caixuan member create --role teammate --mobile 13800138000
  $ caixuan member create --role manager --user-id user123`
    )
    .action(
      async (options: {
        role: 'manager' | 'teammate' | 'guest';
        userId?: string;
        mobile?: string;
        email?: string;
        name?: string;
      }) => {
        try {
          ctx.requireAuth();
          if (!options.userId && !options.mobile && !options.email) {
            ctx.error('Provide --user-id, --mobile, or --email', 'INVALID_ARGS');
          }
          const client = await ctx.getClient();
          const space = await client.spaces.get();
          const created = await client.members.add({
            spaceId: space.id,
            role: options.role,
            userId: options.userId,
            mobile: options.mobile,
            email: options.email,
            name: options.name,
          });
          ctx.output(created, () => chalk.green('✓ Member added'));
        } catch (error) {
          ctx.error(error);
        }
      }
    );

  member
    .command('update <user-id>')
    .description('Update a space member')
    .addOption(new Option('--role <role>', 'New role').choices(['manager', 'teammate', 'guest']))
    .option('--name <name>', 'New display name in the space')
    .option('--body <json>', 'Full JSON body or @file.json')
    .addHelpText(
      'after',
      `
Examples:
  $ caixuan member update user123 --role manager
  $ caixuan member update user123 --name "Alice"
  $ caixuan member update user123 --body '{"role":"teammate","name":"Bob"}'`
    )
    .action(async (userId: string, options: { role?: string; name?: string; body?: string }) => {
      try {
        ctx.requireAuth();
        const body = options.body ? await readJsonBody(options.body) : {};
        const role = (body.role ?? options.role) as string | undefined;
        const name = (body.name ?? options.name) as string | undefined;

        if (!role && !name) {
          ctx.error('Provide --role, --name, or --body with at least one field', 'INVALID_ARGS');
        }

        const client = await ctx.getClient();
        let result: unknown;
        if (role) {
          result = await client.members.updateRole(undefined, userId, role);
        }
        if (name) {
          result = await client.members.rename(undefined, userId, name);
        }
        ctx.output(result, () => chalk.green('✓ Member updated'));
      } catch (error) {
        ctx.error(error);
      }
    });

  member
    .command('delete <user-id>')
    .description('Remove a member from the current space')
    .action(async (userId: string) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        await client.members.remove(undefined, userId);
        ctx.output({ userId, deleted: true }, () => chalk.green('✓ Member removed'));
      } catch (error) {
        ctx.error(error);
      }
    });
}
