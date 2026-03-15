import { type Stack, makeStackFromCards, makeNumberCard, computeResult } from '$lib/cards';

function splitStack(stacks: Stack[], stack: Stack): void {
  const operatorCard = stack.cards.find((c) => c.type === 'add' || c.type === 'multiply')!;
  const resultCard = makeNumberCard(stack.progressResult!);
  const opStack = makeStackFromCards({ x: stack.pos.x, y: stack.pos.y }, [operatorCard]);
  const resultStack = makeStackFromCards({ x: stack.pos.x + 1, y: stack.pos.y }, [resultCard]);
  const index = stacks.indexOf(stack);
  stacks.splice(index, 1, opStack, resultStack);
}

export function tick(stacks: Stack[], now: number): void {
  const toSplit: Stack[] = [];
  for (const stack of stacks) {
    if (stack.dragging) {
      stack.progress = 0;
      stack.progressStartTime = null;
      stack.progressResult = null;
      continue;
    }
    const result = computeResult(stack);
    if (result === null) {
      stack.progress = 0;
      stack.progressStartTime = null;
      stack.progressResult = null;
      continue;
    }
    if (result !== stack.progressResult) {
      stack.progressResult = result;
      stack.progressStartTime = now;
      stack.progress = 0;
    } else {
      stack.progress = Math.min((now - stack.progressStartTime!) / (result * 100), 1);
      if (stack.progress >= 1) toSplit.push(stack);
    }
  }
  for (const stack of toSplit) splitStack(stacks, stack);
}
