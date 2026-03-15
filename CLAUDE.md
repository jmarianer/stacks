## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, mcp

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

---

Handoff notes from Regular Claude:
Project: Card game in SvelteKit + TypeScript
Stack: SvelteKit minimal, TypeScript, Prettier, ESLint, Vitest, Playwright, native CSS (no Tailwind utility classes, though Tailwind is installed for its reset). Font: BigNoodleTitling (BNT) served from static/fonts/BNT.ttf.
What's built so far:
src/lib/Draggable.svelte — a wrapper component that handles mouse drag (onMouseDown on div, onMouseMove and onMouseUp on window via <svelte:window>). Accepts onDrag: (dx, dy) => void and spreads all other props (class, style, onwheel etc.) onto its inner div via rest props with HTMLAttributes<HTMLDivElement>. Renders children via {@render children()}.
src/lib/Card.svelte — uses Draggable, displays a card with a circle in the middle showing the card's value. Sized at 20vmin × 28vmin (5:7 aspect ratio). Props: value, style, onDrag. Uses BNT font for the number.
src/lib/SettingsDialog.svelte — a native HTML <dialog> element with showModal()/close(), a backdrop, title, placeholder text and Save/Cancel buttons. Opened via an exported open() method.
src/routes/+page.svelte — just renders <MainView />.
src/routes/MainView.svelte — the main component. Contains:

A vmin state variable set to pixels-per-vmin (i.e. Math.min(window.innerWidth, window.innerHeight) / 100)
scale, translateX, translateY state for zoom/pan
Board is 140vmin × 140vmin (so 140 in the vmin coordinate system), centered on mount via $effect
Mouse wheel zoom toward cursor using the formula: newTranslate = mousePos - (mousePos - currentTranslate) * (newScale / currentScale)
Board is a <Draggable class="board"> with the transform applied via style prop
WASD pan via <svelte:window onkeydown>
Card type: { value: number, color: string, x: number, y: number, vx: number, vy: number } where x/y are in vmin units
Two cards in $state<Card[]> as initial state
Cards rendered with {#each cards as card}, position via inline style
onDrag converts pixel deltas to vmin: card.x += dx / (vmin * scale)
A requestAnimationFrame game loop in a $effect that applies velocity and decays it by 0.9 each frame (friction). Cleanup via the effect's return function.

Next up: Add repulsion logic to the game loop — for every pair of overlapping cards, apply a repulsion force to their velocities to make them glide apart.
Coordinate system notes:

All positions are in vmin units
vmin variable = pixels per 1 vmin (e.g. ~10 on a 1080p screen)
Board is 140 units wide and tall
Cards are 20 units wide, 28 units tall

Conventions:

Svelte 5 runes mode ($state, $props, $effect, $derived)
2 space indentation
Scoped styles where possible, :global where necessary (e.g. classes passed into Draggable)
Native CSS nesting
lang="ts" on all script blocks