<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { themeState } from '$lib/state/theme.svelte';

  let { children } = $props();

  $effect(() => {
    document.documentElement.dataset.theme = themeState.mode;
  });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
