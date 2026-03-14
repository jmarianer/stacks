<script lang="ts">
  let dialog: HTMLDialogElement;

  export function open() {
    dialog.showModal();
  }

  function close() {
    dialog.close();
  }
</script>

<dialog bind:this={dialog}>
  <h2>Settings</h2>
  <p>Hi, I'm a dialog.</p>
  <div class="buttons">
    <button onclick={close}>Save</button>
    <button onclick={close}>Cancel</button>
  </div>
</dialog>

<style>
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  dialog[open] {
    display: flex;
    margin: auto;
    border-radius: 5vmin;
    border: 1vmin solid rgba(0,0,0,0.8);
    box-shadow: 0.2vmin 0.2vmin rgba(50,50,50,0.8);
    flex-direction: column;
    outline: 0.5vmin solid #FFF;
    min-width: 50vmin;
    font-family: BigNoodleTitling;

    h2 {
        text-transform: uppercase;
        font-size: 2em;
        width: 100%;
        border-bottom: 1vmin solid rgba(0,0,0,0.8);
        text-align: center;
    }

    p {
        padding: 1rem;
    }

    .buttons {
        display: flex;
        justify-content: space-evenly;
        padding-bottom: 0.5rem;
    }

    button {
        border: 0.5vmin solid #000;
        text-align: center;
        border-radius: 1vmin;
        min-width: 20vmin;
        font-size: 1.5em;

        &:hover {
            background-color: #DDD;
        }
    }
  }
</style>