export type CardDef = {
  title: string;
  symbol?: string; // fallback emoji, used when no image is available
  image?: string;  // path to SVG under /cards/
  color: string;
  value?: number;            // coin value; undefined = not sellable
  usesInitial?: number;      // starting usesRemaining; undefined = single-use
  energyValueInitial?: number; // starting energy units (energy cells only)
};

export const CARD_CATALOG = {
  // Resources
  'alien-parts':       { title: 'Alien Parts',        image: 'alien-parts.svg',       color: '#69F0AE', value: 15 },
  biomass:             { title: 'Biomass',             image: 'biomass.svg',            color: '#4A7C3F', value:  1 },
  'energy-cell':       { title: 'Energy Cell',         image: 'energy-cell.svg',        color: '#F4C430', value:  1, energyValueInitial:  1 },
  'multi-cell':        { title: 'Multi-Cell',          image: 'multi-cell.svg',         color: '#FFB300', value:  4, energyValueInitial:  4 },
  'mega-cell':         { title: 'Mega-Cell',           image: 'mega-cell.svg',          color: '#FF6F00', value: 16, energyValueInitial: 16 },
  computronium:        { title: 'Computronium',        image: 'computronium.svg',       color: '#3F51B5', value: 10 },
  'crust-chunk':       { title: 'Crust Chunk',         image: 'crust-chunk.svg',        color: '#8B7355', value:  1 },
  'dark-matter':       { title: 'Dark Matter',         image: 'dark-matter.svg',        color: '#4A148C', value: 15 },
  'dark-matter-chunk': { title: 'Dark Matter Chunk',   image: 'dark-matter-chunk.svg',  color: '#6A1B9A', value:  5 },
  electronics:         { title: 'Electronics',         image: 'electronics.svg',        color: '#00ACC1', value:  3 },
  'fossil-regolith':   { title: 'Fossil Regolith',     image: 'fossil-regolith.svg',    color: '#A1887F', value:  1 },
  helium3:             { title: 'Helium-3',             image: 'helium3.svg',            color: '#87CEEB', value:  1 },
  'higgs-boson':       { title: 'Higgs Boson',         image: 'higgs-boson.svg',        color: '#9E9E9E', value:  1 },
  nanocarbon:          { title: 'Nanocarbon',          image: 'nanocarbon.svg',         color: '#212121', value:  2 },
  plasteel:            { title: 'Plasteel',             image: 'plasteel.svg',           color: '#607D8B', value:  2 },
  'plasteel-deposit':  { title: 'Plasteel Deposit',    image: 'plasteel-deposit.svg',   color: '#455A64', value:  1, usesInitial: 3 },
  'snow-block':        { title: 'Snow Block',           image: 'snow-block.svg',         color: '#B3E5FC', value:  1 },
  'snow-pile':         { title: 'Snow Pile',            image: 'snow-pile.svg',          color: '#90CAF9', value:  1 },
  'snow-sphere':       { title: 'Snow Sphere',          image: 'snow-sphere.svg',        color: '#64B5F6', value:  1 },
  snowballs:           { title: 'Snowballs',            image: 'snowballs.svg',          color: '#4FC3F7', value:  1 },
  unobtainium:         { title: 'Unobtainium',         image: 'unobtainium.svg',        color: '#E91E63', value: 10 },
  wishalloy:           { title: 'Wishalloy',            image: 'wishalloy.svg',          color: '#B8860B', value: 15 },
  // Ideas — cosmetic notification cards dropped when a milestone unlocks a recipe; sellable for $1
  'idea-workbench':       { title: 'Idea: Workbench',       symbol: '💡', color: '#827717', value: 1 },
  'idea-service-drone':   { title: 'Idea: Drone',           symbol: '💡', color: '#827717', value: 1 },
  'idea-solar-panel':     { title: 'Idea: Solar Panel',     symbol: '💡', color: '#827717', value: 1 },
  'idea-electronics':     { title: 'Idea: Electronics',     symbol: '💡', color: '#827717', value: 1 },
  'idea-drill':           { title: 'Idea: Drill',           symbol: '💡', color: '#827717', value: 1 },
  'idea-adv-workbench':   { title: 'Idea: Adv. Workbench',  symbol: '💡', color: '#827717', value: 1 },
  'idea-computronium':    { title: 'Idea: Computronium',    symbol: '💡', color: '#827717', value: 1 },
  'idea-power-station':   { title: 'Idea: Power Station',   symbol: '💡', color: '#827717', value: 1 },
  'idea-cloning-chamber': { title: 'Idea: Cloning Chamber', symbol: '💡', color: '#827717', value: 1 },
  // Teleport
  teleport:           { title: 'Teleport',        symbol: '⬡',                  color: '#00BCD4' },
  // Units
  astronaut:          { title: 'Astronaut',      image: 'astronaut.svg',        color: '#5C85B4' },
  'service-drone-1':  { title: 'Service Drone',  image: 'service-drone-1.svg',  color: '#546E7A' },
  'pet-alien-bug':    { title: 'Pet Alien Bug',  image: 'alien-bug.svg',        color: '#8BC34A' },
  // Critters / wildlife
  cactus:             { title: 'Cactus',          image: 'cactus.svg',           color: '#4CAF50', value: 1 },
  'alien-eggs':       { title: 'Alien Eggs',      image: 'alien-eggs.svg',       color: '#CDDC39', value: 2 },
  // Buildings
  workbench:          { title: 'Workbench',       image: 'workbench.svg',        color: '#795548', value: 5 },
  'solar-panel':      { title: 'Solar Panel',     image: 'solar-panel.svg',      color: '#F57F17', value: 5 },
  drill:              { title: 'Drill',            image: 'drill.svg',            color: '#546E7A', value: 5 },
  'adv-workbench':    { title: 'Adv. Workbench',  image: 'adv-workbench.svg',    color: '#4E342E', value: 5 },
  'power-station':    { title: 'Power Station',   image: 'power-station.svg',    color: '#1565C0', value: 5 },
  'cloning-chamber':  { title: 'Cloning Chamber', image: 'cloning-chamber.svg',  color: '#4A148C', value: 5 },
  'snow-converter':   { title: 'Snow Converter',  image: 'snow-converter.svg',   color: '#90CAF9', value: 5 },
  'power-flower':     { title: 'Power Flower',    image: 'power-flower.svg',     color: '#FF4081', value: 5 },
  'drill-tres2b':     { title: 'Tres-2b Drill',   image: 'drill.svg',            color: '#9C27B0', value: 5 },
} satisfies Record<string, CardDef>;

export type CardType = keyof typeof CARD_CATALOG;
