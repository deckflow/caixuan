import type { MySpace } from '@caixuan-cc/sdk';
import { runPrompt } from './interactive-parse.js';

export function formatSpaceChoice(space: MySpace): string {
  const current = space.selected ? ' (current)' : '';
  const role = space.role ? ` [${space.role}]` : '';
  return `${space.name || space.id}${role}${current}`;
}

export async function promptSelectSpace(spaces: MySpace[]): Promise<string> {
  if (spaces.length === 0) {
    throw new Error('No spaces found.');
  }
  if (spaces.length === 1) {
    return spaces[0]!.id;
  }

  const { spaceId } = (await runPrompt([
    {
      type: 'list',
      name: 'spaceId',
      message: 'Select a space',
      choices: spaces.map((space) => ({
        name: formatSpaceChoice(space),
        value: space.id,
      })),
      default: spaces.find((space) => space.selected)?.id,
    },
  ])) as { spaceId: string };

  return spaceId;
}
