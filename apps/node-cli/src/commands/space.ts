import { Command } from 'commander';
import chalk from 'chalk';
import { Context } from '../context.js';

function formatSpaceList(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return 'No spaces found.';
  return rows
    .map((space) => {
      const selected = space.selected ? chalk.green(' *') : '';
      return `${selected} ${chalk.cyan(String(space.id))}  ${space.name ?? ''}  [${space.role ?? ''}]`;
    })
    .join('\n');
}

export function registerSpaceCommands(program: Command, ctx: Context): void {
  const space = program.command('space').description('Manage workspaces/spaces');

  space
    .command('list')
    .description('List all spaces the current user has joined')
    .addHelpText('after', '\nExample:\n  $ caixuan space list --json')
    .action(async () => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const result = await client.spaces.list();
        ctx.output(result, (data) => formatSpaceList((data as { rows: Array<Record<string, unknown>> }).rows), {
          count: result.count,
        });
      } catch (error) {
        ctx.error(error);
      }
    });

  space
    .command('current')
    .description('Show the currently selected space')
    .action(async () => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const current = await client.spaces.current();
        if (!current) {
          ctx.error('No current space. Run `caixuan space select <space-id>`.', 'INVALID_ARGS');
        }
        ctx.output(current, (data) => {
          const s = data as Record<string, unknown>;
          return [
            `${chalk.bold('Current space:')}`,
            `  ID: ${chalk.cyan(String(s.id))}`,
            `  Name: ${s.name ?? ''}`,
            `  Role: ${s.role ?? ''}`,
          ].join('\n');
        });
      } catch (error) {
        ctx.error(error);
      }
    });

  space
    .command('select <space-id>')
    .description('Switch the current space and persist the selection')
    .addHelpText('after', '\nExample:\n  $ caixuan space select team12345')
    .action(async (spaceId: string) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        await client.spaces.select(spaceId);
        await ctx.config.setSpaceId(spaceId);
        client.setSpaceId(spaceId);
        ctx.output({ spaceId, selected: true }, () => chalk.green(`✓ Selected space ${spaceId}`));
      } catch (error) {
        ctx.error(error);
      }
    });

  space
    .command('get [space-id]')
    .description('Get space details (defaults to current space)')
    .action(async (spaceId?: string) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const detail = await client.spaces.get(spaceId);
        ctx.output(detail);
      } catch (error) {
        ctx.error(error);
      }
    });
}
