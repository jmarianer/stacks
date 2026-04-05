import { untrack } from 'svelte';
import { gameState } from '$lib/state/game-state.svelte';

export function useBoardView(getBoardAreaEl: () => HTMLElement | null) {
  let scale = $state(1);
  const translate = $state({ x: 0, y: 0 });
  let vmin = $state(0);
  const mousePosition = { x: 0, y: 0 };

  function updateVmin(): void {
    vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
  }

  $effect(() => {
    const el = getBoardAreaEl();
    const idx = gameState.currentBoardIndex;
    untrack(() => {
      if (!el) return;
      updateVmin();
      const boardW = gameState.boards[idx].width * vmin;
      const boardH = gameState.boards[idx].height * vmin;
      scale = Math.min(el.clientWidth / boardW, el.clientHeight / boardH) * 0.95;
      translate.x = (el.clientWidth - boardW * scale) / 2;
      translate.y = (el.clientHeight - boardH * scale) / 2;
    });
  });

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = getBoardAreaEl()?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    scale = scale * zoomFactor;
    translate.x = localX - (localX - translate.x) * zoomFactor;
    translate.y = localY - (localY - translate.y) * zoomFactor;
  }

  function boardMouse(): { x: number; y: number } {
    const rect = getBoardAreaEl()?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return {
      x: (mousePosition.x - rect.left - translate.x) / (vmin * scale),
      y: (mousePosition.y - rect.top - translate.y) / (vmin * scale),
    };
  }

  function boardPosFromEvent(e: MouseEvent): { x: number; y: number } {
    const rect = getBoardAreaEl()?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return {
      x: (e.clientX - rect.left - translate.x) / (vmin * scale),
      y: (e.clientY - rect.top - translate.y) / (vmin * scale),
    };
  }

  function updateMousePosition(x: number, y: number): void {
    mousePosition.x = x;
    mousePosition.y = y;
  }

  return {
    get scale() {
      return scale;
    },
    get translate() {
      return translate;
    },
    get vmin() {
      return vmin;
    },
    onWheel,
    boardMouse,
    boardPosFromEvent,
    updateMousePosition,
    updateVmin,
  };
}
