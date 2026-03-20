<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  export interface DragProps {
    onDrag: (dx: number, dy: number) => void;
    onDragStart?: (e: MouseEvent) => void;
    onDragEnd?: () => void;
  }

  let {
    onDrag,
    onDragStart,
    onDragEnd,
    children,
    class: className,
    ...rest
  } = $props<DragProps & { children: Snippet } & HTMLAttributes<HTMLDivElement>>();

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  function onMouseDown(e: MouseEvent) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    e.stopPropagation();
    onDragStart?.(e);
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    onDrag(e.clientX - lastX, e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function onMouseUp() {
    if (isDragging) onDragEnd?.();
    isDragging = false;
  }
</script>

<svelte:window onmouseup={onMouseUp} onmousemove={onMouseMove} />

<div class={className} onmousedown={onMouseDown} {...rest}>
  {@render children()}
</div>
