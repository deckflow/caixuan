import { Command } from 'commander';
import chalk from 'chalk';
import { Context } from '../context.js';

function maskBasicAuth(value: string): string {
  const sep = value.indexOf(':');
  if (sep <= 0) return '***';
  return `${value.slice(0, sep)}:***`;
}

export function registerConfigCommands(program: Command, ctx: Context): void {
  const config = program.command('config').description('Manage CLI configuration');

  config
    .command('set-token <token>')
    .description('Set authentication token manually')
    .action(async (token: string) => {
      try {
        await ctx.config.setToken(token);
        const client = await ctx.getClient();
        client.setToken(token);
        ctx.output({ token: '***', message: 'Token set successfully' }, () =>
          chalk.green('✓ Token set successfully')
        );
      } catch (error) {
        ctx.error(error);
      }
    });

  config
    .command('set-space <space-id>')
    .description('Set current space ID')
    .action(async (spaceId: string) => {
      try {
        await ctx.config.setSpaceId(spaceId);
        const client = await ctx.getClient();
        client.setSpaceId(spaceId);
        ctx.output({ spaceId, message: 'Space ID set successfully' }, () =>
          chalk.green('✓ Space ID set successfully')
        );
      } catch (error) {
        ctx.error(error);
      }
    });

  config
    .command('set-api-base <url>')
    .description('Set API base URL')
    .action(async (url: string) => {
      try {
        await ctx.config.setApiBase(url);
        ctx.resetClient();
        ctx.output({ apiBase: url, message: 'API base URL set successfully' }, () =>
          chalk.green('✓ API base URL set successfully')
        );
      } catch (error) {
        ctx.error(error);
      }
    });

  config
    .command('set-basic-auth <credentials>')
    .description('Set nginx HTTP Basic Auth credentials as username:password')
    .addHelpText(
      'after',
      `
Examples:
  $ caixuan config set-basic-auth tester:secret
  $ CAIXUAN_BASIC_AUTH=tester:secret caixuan login`
    )
    .action(async (credentials: string) => {
      try {
        if (!credentials.includes(':')) {
          ctx.error('Basic auth credentials must be in username:password format.', 'INVALID_ARGS');
        }
        await ctx.config.setBasicAuth(credentials);
        ctx.resetClient();
        ctx.output({ basicAuth: maskBasicAuth(credentials), message: 'Basic auth set successfully' }, () =>
          chalk.green('✓ Basic auth set successfully')
        );
      } catch (error) {
        ctx.error(error);
      }
    });

  config
    .command('unset-basic-auth')
    .description('Remove saved nginx HTTP Basic Auth credentials')
    .action(async () => {
      try {
        await ctx.config.clearBasicAuth();
        ctx.resetClient();
        ctx.output({ basicAuth: null, message: 'Basic auth removed' }, () =>
          chalk.green('✓ Basic auth removed')
        );
      } catch (error) {
        ctx.error(error);
      }
    });

  config
    .command('show')
    .description('Show current configuration')
    .action(() => {
      try {
        const allConfig = { ...ctx.config.all(), basicAuth: ctx.config.basicAuth };
        const displayConfig = { ...allConfig };
        if (displayConfig.token && !ctx.jsonOutput) {
          displayConfig.token = `${displayConfig.token.slice(0, 8)}...`;
        }
        if (displayConfig.basicAuth && !ctx.jsonOutput) {
          displayConfig.basicAuth = maskBasicAuth(displayConfig.basicAuth);
        }
        ctx.output(displayConfig, (data) => {
          const content = Object.entries(data as Record<string, unknown>)
            .map(([key, value]) => `${chalk.cyan(key)}: ${value || chalk.gray('(not set)')}`)
            .join('\n');
          if (!allConfig.token) {
            return `${content}\n${chalk.yellow('Tip: run `caixuan login` or `caixuan config set-token <token>`.')}`;
          }
          return content;
        });
      } catch (error) {
        ctx.error(error);
      }
    });
}
