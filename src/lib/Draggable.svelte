<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    onDrag,
    children,
    class: className,
    ...rest
  } = $props<
    {
      onDrag: (dx: number, dy: number) => void;
      children: Snippet;
    } & HTMLAttributes<HTMLDivElement>
  >();

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  function onMouseDown(e: MouseEvent) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    e.stopPropagation();
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    onDrag(e.clientX - lastX, e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function onMouseUp() {
    isDragging = false;
  }
</script>

<svelte:window onmouseup={onMouseUp} onmousemove={onMouseMove} />

<div class={className} onmousedown={onMouseDown} {...rest}>
  {@render children()}
</div>
