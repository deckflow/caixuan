import { Command } from 'commander';
import chalk from 'chalk';
import { Context } from '../context.js';

export function registerLoginCommand(program: Command, ctx: Context): void {
  program
    .command('login')
    .description('Login to Caixuan via browser and save authentication token')
    .option('--port <port>', 'Local callback server port', '3737')
    .addHelpText(
      'after',
      `
Examples:
  $ caixuan login
  $ caixuan login --port 3738`
    )
    .action(async (options: { port: string }) => {
      try {
        const port = Number.parseInt(options.port, 10);
        await ctx.ensureLoggedIn(port, 'explicit');
        ctx.output(
          { success: true, message: 'Login successful' },
          () => chalk.green('✓ Login successful!')
        );
      } catch (error) {
        ctx.error(error);
      }
    });
}

export function registerLogoutCommand(program: Command, ctx: Context): void {
  program
    .command('logout')
    .description('Logout and remove saved token')
    .action(async () => {
      try {
        if (ctx.config.token) {
          const client = await ctx.getClient();
          await client.session.logout();
        }
        await ctx.config.clearToken();
        ctx.output({ success: true }, () => chalk.green('✓ Logged out'));
      } catch (error) {
        ctx.error(error);
      }
    });
}
