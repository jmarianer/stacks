<script lang="ts">
  import type { Clock } from '$lib/types/game-state';
  import { themeState, type ThemeMode } from '$lib/state/theme.svelte';

  let {
    clock,
    solProgress,
    energyAvailable,
    energyNeeded,
    routingMode = $bindable(),
    onSetSpeed,
  }: {
    clock: Clock;
    solProgress: number;
    energyAvailable: number;
    energyNeeded: number;
    routingMode: boolean;
    onSetSpeed: (clock: Clock, speed: number) => void;
  } = $props();

  const themeIcon: Record<ThemeMode, string> = { system: '⊙', dark: '☽', light: '☀' };
  const themeTitle: Record<ThemeMode, string> = {
    system: 'Theme: system',
    dark: 'Theme: dark',
    light: 'Theme: light',
  };
</script>

<div class="hud">
  <div class="speed-controls">
    <button
      class="speed-btn"
      class:active={clock.speed === 0 && !clock.endOfSol}
      onclick={() => onSetSpeed(clock, 0)}
      disabled={clock.endOfSol}>⏸</button
    >
    {#each [1, 2, 3] as s (s)}
      <button
        class="speed-btn"
        class:active={clock.speed === s && !clock.endOfSol}
        onclick={() => onSetSpeed(clock, s)}
        disabled={clock.endOfSol}>{s}×</button
      >
    {/each}
  </div>
  <span class="sol-hud">Sol {clock.sol}</span>
  <div class="sol-bar"><div class="sol-bar-fill" style="width: {solProgress * 100}%"></div></div>
  <span class="energy-hud" class:short={energyAvailable < energyNeeded}>
    ⚡ {energyAvailable} / {energyNeeded}
  </span>
  <button
    class="recipes-toggle"
    class:active={routingMode}
    onclick={() => (routingMode = !routingMode)}
    title="Routing mode (R)">⛓</button
  >
  <button
    class="theme-toggle"
    onclick={() => themeState.cycle()}
    title={themeTitle[themeState.mode]}>{themeIcon[themeState.mode]}</button
  >
</div>

<style>
  .hud {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background: var(--chrome-bg);
    font-family: 'BigNoodleTitling', sans-serif;
    color: var(--text);
    font-size: 1.5rem;
    pointer-events: none;

    .speed-controls {
      display: flex;
      gap: 0.2rem;
      pointer-events: all;
    }

    .speed-btn {
      background: var(--btn-bg);
      border: 1px solid var(--btn-border);
      border-radius: 0.3rem;
      color: var(--text);
      font-family: 'BigNoodleTitling', sans-serif;
      font-size: 1.1rem;
      padding: 0.1rem 0.4rem;
      cursor: pointer;
      opacity: 0.6;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        opacity: 1;
      }

      &.active {
        background: color-mix(in srgb, var(--accent) 25%, transparent);
        border-color: var(--accent);
        color: var(--accent);
        opacity: 1;
      }

      &:disabled {
        opacity: 0.3;
        cursor: default;
      }
    }

    .sol-hud {
      opacity: 0.8;
    }

    .sol-bar {
      width: 6rem;
      height: 0.5rem;
      background: color-mix(in srgb, var(--text) 25%, transparent);
      border-radius: 0.25rem;
      overflow: hidden;

      .sol-bar-fill {
        height: 100%;
        background: var(--sol-fill);
        transition: width 0.1s linear;
      }
    }

    .energy-hud {
      opacity: 0.85;
      &.short {
        color: #ff6b6b;
        opacity: 1;
      }
    }

    .recipes-toggle {
      background: var(--btn-bg);
      border: 1px solid var(--btn-border);
      border-radius: 0.4rem;
      color: var(--text);
      font-size: 1.25rem;
      padding: 0.2rem 0.5rem;
      cursor: pointer;
      pointer-events: all;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }

      &.active {
        background: color-mix(in srgb, var(--accent) 25%, transparent);
        border-color: var(--accent);
        color: var(--accent);
      }
    }

    .theme-toggle {
      background: var(--btn-bg);
      border: 1px solid var(--btn-border);
      border-radius: 0.4rem;
      color: var(--text);
      font-size: 1.1rem;
      padding: 0.2rem 0.5rem;
      cursor: pointer;
      pointer-events: all;
      opacity: 0.7;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
        opacity: 1;
      }
    }

  }
</style>
