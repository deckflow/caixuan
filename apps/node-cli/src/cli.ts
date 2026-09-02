#!/usr/bin/env node

import { Command, CommanderError } from 'commander';
import { createRequire } from 'module';
import { Context } from './context.js';
import { registerLoginCommand, registerLogoutCommand } from './commands/auth.js';
import { registerConfigCommands } from './commands/config.js';
import { registerSpaceCommands } from './commands/space.js';
import { registerShareCommands } from './commands/share.js';
import { registerDocCommands } from './commands/doc.js';
import { registerMemberCommands } from './commands/member.js';
import { ExitCode, outputError } from './utils/errors.js';
import { parseWithInteractiveRepair } from './utils/interactive-parse.js';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json') as { version?: string };
const CLI_VERSION = packageJson.version ?? '0.0.0';

async function main() {
  const ctx = new Context();
  await ctx.init();
  if (process.argv.includes('--json')) {
    ctx.jsonOutput = true;
  }
  if (process.argv.includes('--debug')) {
    ctx.debugOutput = true;
  }

  const program = new Command();

  program
    .name('caixuan')
    .description('Caixuan CLI — manage spaces, shares, documents and members')
    .version(CLI_VERSION)
    .option('--json', 'Output structured JSON for scripting and AI agents')
    .option('--debug', 'Print request details when API calls fail')
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.optsWithGlobals();
      ctx.jsonOutput = Boolean(opts.json);
      ctx.debugOutput = Boolean(opts.debug);
    })
    .addHelpText(
      'after',
      `
Examples:
  $ caixuan login
  $ caixuan space list --json
  $ caixuan share create --name "Demo" --doc doc123
  $ caixuan doc create --file ./deck.pptx
  $ caixuan member list

Use "caixuan <command> --help" for details on a command.`
    );

  registerLoginCommand(program, ctx);
  registerLogoutCommand(program, ctx);
  registerConfigCommands(program, ctx);
  registerSpaceCommands(program, ctx);
  registerShareCommands(program, ctx);
  registerDocCommands(program, ctx);
  registerMemberCommands(program, ctx);

  try {
    await parseWithInteractiveRepair(program, process.argv);
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.code === 'commander.help' || error.code === 'commander.helpDisplayed') {
        process.exit(error.exitCode ?? 1);
      }
      if (error.code === 'commander.version') {
        process.exit(0);
      }
    }
    outputError(error as Error, ctx.jsonOutput, ctx.debugOutput);
    process.exit(ExitCode.ERROR);
  }

  if (process.argv.length <= 2) {
    program.help();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(ExitCode.ERROR);
});
