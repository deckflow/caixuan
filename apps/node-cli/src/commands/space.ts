import { Command } from 'commander';
import chalk from 'chalk';
import { Context } from '../context.js';
import { isInteractiveCapable } from '../utils/interactive-parse.js';
import { outputSpaceList } from '../utils/list-format.js';
import { promptSelectSpace } from '../utils/space-select.js';

async function resolveSpaceId(ctx: Context, spaceId?: string): Promise<string> {
  if (spaceId) return spaceId;

  if (ctx.jsonOutput) {
    ctx.error('space-id is required when using --json', 'INVALID_ARGS');
  }
  if (!isInteractiveCapable(process.argv)) {
    ctx.error(
      'space-id is required in non-interactive mode. Run `caixuan space list` to see available spaces.',
      'INVALID_ARGS'
    );
  }

  const client = await ctx.getClient();
  const result = await client.spaces.list();
  return promptSelectSpace(result.rows);
}

async function applySpaceSelection(ctx: Context, spaceId: string): Promise<void> {
  const client = await ctx.getClient();
  await client.spaces.select(spaceId);
  await ctx.config.setSpaceId(spaceId);
  client.setSpaceId(spaceId);
  ctx.output({ spaceId, selected: true }, () => chalk.green(`✓ Selected space ${spaceId}`));
}

export function registerSpaceCommands(program: Command, ctx: Context): void {
  const space = program.command('space').description('Manage workspaces/spaces');

  space
    .command('list')
    .description('List all spaces the current user has joined')
    .option('--table', 'Output as a table')
    .addHelpText(
      'after',
      '\nExamples:\n  $ caixuan space list\n  $ caixuan space list --table\n  $ caixuan space list --json'
    )
    .action(async (options: { table?: boolean }) => {
      try {
        ctx.requireAuth();
        const client = await ctx.getClient();
        const result = await client.spaces.list();
        outputSpaceList(ctx, result, options.table);
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
          ctx.error('No current space. Run `caixuan space select`.', 'INVALID_ARGS');
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
    .command('select [space-id]')
    .description('Switch the current space and persist the selection')
    .addHelpText(
      'after',
      `
Examples:
  $ caixuan space select team12345
  $ caixuan space select`
    )
    .action(async (spaceId?: string) => {
      try {
        ctx.requireAuth();
        const selectedId = await resolveSpaceId(ctx, spaceId);
        await applySpaceSelection(ctx, selectedId);
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
