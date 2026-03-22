<script lang="ts">
  import { CARD_CATALOG, type CardType } from '$lib/data/card-defs';
  import { recipes } from '$lib/data/recipes';
  import type { RecipeResult } from '$lib/types/recipe-types';

  let { knownRecipeIds }: { knownRecipeIds: string[] } = $props();

  let recipeSearch = $state('');

  function ingredientLabel(match: string): string {
    if (match === 'people') return 'Person';
    const def = CARD_CATALOG[match as CardType];
    return def ? def.title : match;
  }

  function resultLabel(result: RecipeResult): string {
    if (result.action === 'card') {
      const def = CARD_CATALOG[result.card as CardType];
      const name = def ? def.title : result.card;
      return result.chance !== undefined ? `${name} (${result.chance}%)` : name;
    }
    if (result.action === 'weighted') {
      return Object.keys(result.cards)
        .map((k) => {
          const d = CARD_CATALOG[k as CardType];
          return d ? d.title : k;
        })
        .join(' / ');
    }
    if (result.action === 'unlock-recipe') {
      const r = recipes.find((rec) => rec.id === result.recipeId);
      return `Unlocks: ${r?.label ?? result.recipeId}`;
    }
    return '';
  }
</script>

<div class="recipes-panel">
  <div class="recipes-title">Known Recipes</div>
  <input class="recipe-search" type="search" placeholder="Search…" bind:value={recipeSearch} />
  {#each knownRecipeIds as id (id)}
    {@const recipe = recipes.find((r) => r.id === id)}
    {#if recipe && recipe.label.toLowerCase().includes(recipeSearch.toLowerCase())}
      <div class="recipe-entry">
        <div class="recipe-name">
          {recipe.label}
          <span class="recipe-time">{recipe.time / 1000}s</span>
        </div>
        <div class="recipe-ingredients">
          {#each recipe.ingredients as ing, i (ing)}
            {#if i > 0}<span class="sep">+</span>{/if}
            <span class="ingredient" class:reusable={!ing.consumed}>
              {#if ing.count && ing.count > 1}{ing.count}×{/if}
              {ingredientLabel(ing.match)}
              {#if !ing.consumed}↺{/if}
            </span>
          {/each}
        </div>
        <div class="recipe-results">
          {#each recipe.results as result, i (result)}
            {#if i > 0}<span class="sep">·</span>{/if}
            <span class="result">{resultLabel(result)}</span>
          {/each}
        </div>
      </div>
    {/if}
  {/each}
</div>

<style>
  .recipes-panel {
    position: absolute;
    top: 3.5rem;
    right: 1rem;
    background: rgba(10, 10, 20, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font-family: 'BigNoodleTitling', sans-serif;
    color: white;
    font-size: 1.1rem;
    min-width: 16rem;
    max-height: calc(100vh - 5rem);
    overflow-y: auto;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    .recipes-title {
      font-size: 1.3rem;
      color: #f4c430;
      margin-bottom: 0.1rem;
      letter-spacing: 0.05em;
    }

    .recipe-search {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.3rem;
      color: white;
      font-family: 'BigNoodleTitling', sans-serif;
      font-size: 1rem;
      padding: 0.25rem 0.5rem;
      width: 100%;
      box-sizing: border-box;

      &::placeholder {
        opacity: 0.4;
      }
      &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.4);
      }
    }

    .recipe-entry {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .recipe-name {
        font-size: 1.1rem;
        color: #e0e0e0;
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .recipe-time {
        opacity: 0.5;
        font-size: 0.95rem;
      }

      .recipe-ingredients,
      .recipe-results {
        font-size: 0.9rem;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.2rem;
      }

      .recipe-results::before {
        content: '→';
        opacity: 0.5;
        margin-right: 0.1rem;
      }

      .ingredient {
        color: #aaa;
        &.reusable {
          color: #80cbc4;
        }
      }

      .result {
        color: #a5d6a7;
      }

      .sep {
        opacity: 0.4;
      }
    }
  }
</style>
