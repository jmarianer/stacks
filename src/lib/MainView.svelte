<script lang="ts">
  // import SettingsDialog from '$lib/SettingsDialog.svelte';
  // let settingsDialog: SettingsDialog;
  import Card from '$lib/Card.svelte';

  let scale = $state(1);
  let translateX = $state(0);
  let translateY = $state(0);

  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  $effect(() => {
    const vmin = Math.min(window.innerWidth, window.innerHeight);
    const boardSize = vmin * 1.4;
    translateX = (window.innerWidth - boardSize) / 2;
    translateY = (window.innerHeight - boardSize) / 2;
  });

  function onwheel(e: WheelEvent) {
    e.preventDefault();

    console.log(e.deltaY);
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = scale * zoomFactor;

    translateX = e.clientX - (e.clientX - translateX) * (newScale / scale);
    translateY = e.clientY - (e.clientY - translateY) * (newScale / scale);
    scale = newScale;
  }

  function onmousedown(e: MouseEvent) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }

  function onmousemove(e: MouseEvent) {
    if (!isDragging) return;
    translateX += e.clientX - lastMouseX;
    translateY += e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }

  function onmouseup() {
    isDragging = false;
  }

  function onkeydown(e: KeyboardEvent) {
    const speed = 20;
    if (e.key === 'w') translateY += speed;
    if (e.key === 's') translateY -= speed;
    if (e.key === 'a') translateX += speed;
    if (e.key === 'd') translateX -= speed;
  }
</script>

<div class="viewport">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="board"
    style="transform: translate({translateX}px, {translateY}px) scale({scale})"
    {onwheel}
    {onmousedown}
    {onmousemove}
  >
    {#each { length: 2 } as _, row}
      {#each { length: 3 } as _, col}
        <Card value={row * 7 + col + 1} left={col * 40 + 20} top={row * 48 + 20} color="lightgray" />
      {/each}
    {/each}
  </div>
</div>

<svelte:window {onkeydown} {onmouseup} />

<style>
  .viewport {
    width: 100vw;
    height: 100vh;
    background-color: deeppink;
    overflow: hidden;
    position: relative;
  }

  .board {
    width: 140vmin;
    height: 140vmin;
    position: relative;
    background-color: darkolivegreen;
    transform-origin: 0 0;
    border: 1vmin solid rgba(0, 0, 0, 0.8);
    border-radius: 5vmin;
    overflow: hidden;
  }
</style>
