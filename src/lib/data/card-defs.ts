import type { CardDef } from '$lib/types/card-types';

export const CARD_CATALOG: Record<string, CardDef> = {
  // Resources
  'alien-parts': { title: 'Alien Parts', image: 'alien-parts.svg', color: '#69F0AE' },
  biomass: { title: 'Biomass', image: 'biomass.svg', color: '#4A7C3F' },
  'energy-cell': {
    title: 'Energy Cell',
    image: 'energy-cell.svg',
    color: '#F4C430',
    energyValueInitial: 1,
  },
  'multi-cell': {
    title: 'Multi-Cell',
    image: 'multi-cell.svg',
    color: '#FFB300',
    energyValueInitial: 4,
  },
  'mega-cell': {
    title: 'Mega-Cell',
    image: 'mega-cell.svg',
    color: '#FF6F00',
    energyValueInitial: 16,
  },
  computronium: { title: 'Computronium', image: 'computronium.svg', color: '#3F51B5' },
  'crust-chunk': { title: 'Crust Chunk', image: 'crust-chunk.svg', color: '#8B7355' },
  pickaxe: { title: 'Pickaxe', image: 'pickaxe.svg', color: '#78909C' },
  'dark-matter': { title: 'Dark Matter', image: 'dark-matter.svg', color: '#4A148C' },
  'dark-matter-chunk': {
    title: 'Dark Matter Chunk',
    image: 'dark-matter-chunk.svg',
    color: '#6A1B9A',
  },
  electronics: { title: 'Electronics', image: 'electronics.svg', color: '#00ACC1' },
  'fossil-regolith': {
    title: 'Fossil Regolith',
    image: 'fossil-regolith.svg',
    color: '#A1887F',
  },
  helium3: { title: 'Helium-3', image: 'helium3.svg', color: '#87CEEB' },
  'higgs-boson': { title: 'Higgs Boson', image: 'higgs-boson.svg', color: '#9E9E9E' },
  nanocarbon: { title: 'Nanocarbon', image: 'nanocarbon.svg', color: '#212121' },
  plasteel: { title: 'Plasteel', image: 'plasteel.svg', color: '#607D8B' },
  'plasteel-deposit': {
    title: 'Plasteel Deposit',
    image: 'plasteel-deposit.svg',
    color: '#455A64',
    usesInitial: 3,
  },
  unobtainium: { title: 'Unobtainium', image: 'unobtainium.svg', color: '#E91E63' },
  wishalloy: { title: 'Wishalloy', image: 'wishalloy.svg', color: '#B8860B' },
  // Medical
  'band-aid': { title: 'Band-Aid', image: 'band-aid.svg', color: '#E57373' },
  'uni-kit': { title: 'Uni-Kit', image: 'uni-kit.svg', color: '#81C784' },
  // Invasions — countdown cards; progress bar = warning timer; on completion spawns enemies
  'invasion-bacteria': {
    title: '⚠ Bacteria Swarm',
    image: 'invasion-bacteria.svg',
    color: '#B71C1C',
  },
  'invasion-space-mouse': {
    title: '⚠ Space Mouse Pack',
    image: 'invasion-space-mouse.svg',
    color: '#4E342E',
  },
  // Teleport
  teleport: { title: 'Teleport', image: 'teleport.svg', color: '#00BCD4' },
  // Units
  astronaut: {
    title: 'Astronaut',
    image: 'astronaut.svg',
    color: '#5C85B4',
    groups: ['people'],
    feed: { cost: 2, priority: 2 },
    playerUnit: {
      unitStats: { endurance: 1, strength: 1, perception: 1, intelligence: 1, agility: 1, luck: 1 },
      weapon: { damage: 5, damageType: 'impact', attackInterval: 2.0, range: 35 },
      weaponSlots: 3,
      speed: 20,
    },
  },
  'service-drone-1': {
    title: 'Service Drone',
    image: 'service-drone-1.svg',
    color: '#546E7A',
    groups: ['people'],
    feed: { cost: 1, priority: 6 },
  },
  'pet-alien-bug': { title: 'Pet Alien Bug', image: 'alien-bug.svg', color: '#8BC34A' },
  // Enemies
  bacteria: {
    title: 'Bacteria',
    image: 'bacteria.svg',
    color: '#558B2F',
    enemy: {
      unitStats: {
        endurance: -2,
        strength: 1,
        perception: 1,
        intelligence: 1,
        agility: 2,
        luck: 1,
      },
      weapon: { damage: 5, damageType: 'impact', attackInterval: 0.9, range: 35 },
      speed: 12,
      regen: 2,
      loot: [{ action: 'card', card: 'biomass' }],
    },
  },
  'space-mouse': {
    title: 'Space Mouse',
    image: 'space-mouse.svg',
    color: '#795548',
    enemy: {
      unitStats: {
        endurance: 2,
        strength: 1,
        perception: 2,
        intelligence: 1,
        agility: 2,
        luck: 1,
      },
      weapon: { damage: 3, damageType: 'impact', attackInterval: 1.2, range: 35 },
      speed: 12,
      loot: [{ action: 'weighted', cards: { biomass: 2, 'crust-chunk': 1 } }],
    },
  },
  // Critters / wildlife
  'alien-eggs': { title: 'Alien Eggs', image: 'alien-eggs.svg', color: '#CDDC39' },
  // Buildings
  workbench: { title: 'Workbench', image: 'workbench.svg', color: '#795548' },
  'solar-panel': { title: 'Solar Panel', image: 'solar-panel.svg', color: '#F57F17' },
  drill: { title: 'Drill', image: 'drill.svg', color: '#546E7A' },
  'adv-workbench': {
    title: 'Adv. Workbench',
    image: 'adv-workbench.svg',
    color: '#4E342E',
  },
  'power-station': {
    title: 'Power Station',
    image: 'power-station.svg',
    color: '#1565C0',
  },
  'cloning-chamber': {
    title: 'Cloning Chamber',
    image: 'cloning-chamber.svg',
    color: '#4A148C',
  },
  'drill-tres2b': { title: 'Tres-2b Drill', image: 'drill.svg', color: '#9C27B0' },
  rover: { title: 'Rover', image: 'rover.svg', color: '#FF8F00' },
  foundation: { title: 'Foundation', image: 'foundation.svg', color: '#E91E63' },
  refinery: { title: 'Refinery', image: 'refinery.svg', color: '#BF360C' },
  reactor: { title: 'Reactor', image: 'reactor.svg', color: '#1B5E20' },
  // Training stations
  'train-st': { title: 'Strength Station', image: 'train-st.svg', color: '#B71C1C' },
  'train-ag': { title: 'Agility Station', image: 'train-ag.svg', color: '#F57F17' },
  'train-en': { title: 'Endurance Station', image: 'train-en.svg', color: '#1565C0' },
  'train-in': { title: 'Intelligence Station', image: 'train-in.svg', color: '#4527A0' },
  'train-lk': { title: 'Luck Station', image: 'train-lk.svg', color: '#00695C' },
  'train-pe': { title: 'Perception Station', image: 'train-pe.svg', color: '#558B2F' },
  tombstone: { title: 'Tombstone', image: 'tombstone.svg', color: '#546E7A' },
  // Weapons — equip by placing in same stack as a unit
  blaster: {
    title: 'Blaster',
    image: 'weapon-blaster.svg',
    color: '#1565C0',
    groups: ['weapon'],
    weaponStats: { damage: 10, damageType: 'energy', attackInterval: 1.5, range: 80 },
  },
  bolter: {
    title: 'Bolter',
    image: 'weapon-bolter.svg',
    color: '#546E7A',
    groups: ['weapon'],
    weaponStats: { damage: 15, damageType: 'impact', attackInterval: 2.0, range: 100 },
  },
  'bolter-heavy': {
    title: 'Heavy Bolter',
    image: 'weapon-bolter-heavy.svg',
    color: '#37474F',
    groups: ['weapon'],
    weaponStats: { damage: 25, damageType: 'impact', attackInterval: 3.0, range: 100 },
  },
  minigun: {
    title: 'Minigun',
    image: 'weapon-minigun.svg',
    color: '#FF6F00',
    groups: ['weapon'],
    weaponStats: { damage: 8, damageType: 'impact', attackInterval: 0.5, range: 140 },
  },
  'laser-cannon': {
    title: 'Laser Cannon',
    image: 'weapon-laser-cannon.svg',
    color: '#00BCD4',
    groups: ['weapon'],
    weaponStats: { damage: 40, damageType: 'energy', attackInterval: 4.0, range: 160 },
  },
};

export type CardType = keyof typeof CARD_CATALOG;
