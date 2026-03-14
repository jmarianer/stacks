<script lang="ts">
  import SettingsDialog from '$lib/SettingsDialog.svelte';

  let settingsDialog: SettingsDialog;
</script>

<div class="main-view">
  <button onclick={() => settingsDialog.open()}>Settings</button>
  <SettingsDialog bind:this={settingsDialog} />
</div>

<style>
  .main-view {
    background-color: deeppink;
    padding: 1rem;
    height: 100vh;
  }
</style>