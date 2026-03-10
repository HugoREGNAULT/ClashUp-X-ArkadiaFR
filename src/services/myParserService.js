import {
  resolveBuilderHeroKeyById,
  resolveHeroKeyById,
  resolvePetKeyById,
  resolveSiegeMachineKeyById,
  resolveSpellKeyById,
  resolveTroopKeyById
} from "./myIdResolverService.js";

export function parsePlayerExport(raw) {
  const parsed = {
    playerTag: raw.tag ?? null,
    playerName: raw.name ?? null,

    townHall: null,

    heroes: {},
    builderHeroes: {},
    troops: {},
    spells: {},
    pets: {},
    equipment: {},
    siegeMachines: {},

    walls: {
      total: 0,
      byLevel: {}
    },

    heroesCount: 0,
    builderHeroesCount: 0,
    troopsCount: 0,
    spellsCount: 0,
    petsCount: 0,
    equipmentCount: 0,
    siegeMachinesCount: 0,

    unknownMappings: {
      heroes: [],
      builderHeroes: [],
      troops: [],
      spells: [],
      pets: [],
      equipment: [],
      siegeMachines: [],
      buildings: []
    },

    lastSyncAt: new Date().toISOString()
  };

  const WALL_ID = 1000010;
  const TOWNHALL_ID = 1000013;

  for (const hero of raw.heroes ?? []) {
    const id = Number(hero.data);
    const level = Number(hero.lvl);

    if (!Number.isFinite(id) || !Number.isFinite(level)) continue;

    const key = resolveHeroKeyById(id);

    if (!key) {
      parsed.unknownMappings.heroes.push(id);
      continue;
    }

    parsed.heroes[key] = level;
  }

  for (const hero of raw.heroes2 ?? []) {
    const id = Number(hero.data);
    const level = Number(hero.lvl);

    if (!Number.isFinite(id) || !Number.isFinite(level)) continue;

    const key = resolveBuilderHeroKeyById(id);

    if (!key) {
      parsed.unknownMappings.builderHeroes.push(id);
      continue;
    }

    parsed.builderHeroes[key] = level;
  }

  for (const troop of raw.units ?? []) {
    const id = Number(troop.data);
    const level = Number(troop.lvl);

    if (!Number.isFinite(id) || !Number.isFinite(level)) continue;

    const key = resolveTroopKeyById(id);

    if (!key) {
      parsed.unknownMappings.troops.push(id);
      continue;
    }

    parsed.troops[key] = level;
  }

  for (const spell of raw.spells ?? []) {
    const id = Number(spell.data);
    const level = Number(spell.lvl);

    if (!Number.isFinite(id) || !Number.isFinite(level)) continue;

    const key = resolveSpellKeyById(id);

    if (!key) {
      parsed.unknownMappings.spells.push(id);
      continue;
    }

    parsed.spells[key] = level;
  }

  for (const pet of raw.pets ?? []) {
    const id = Number(pet.data);
    const level = Number(pet.lvl);

    if (!Number.isFinite(id) || !Number.isFinite(level)) continue;

    const key = resolvePetKeyById(id);

    if (!key) {
      parsed.unknownMappings.pets.push(id);
      continue;
    }

    parsed.pets[key] = level;
  }

  for (const item of raw.equipment ?? []) {
    const id = Number(item.data);
    const level = Number(item.lvl);

    if (!Number.isFinite(id) || !Number.isFinite(level)) continue;

    parsed.equipment[String(id)] = level;
    parsed.unknownMappings.equipment.push(id);
  }

  for (const siege of raw.siege_machines ?? []) {
    const id = Number(siege.data);
    const level = Number(siege.lvl);

    if (!Number.isFinite(id) || !Number.isFinite(level)) continue;

    const key = resolveSiegeMachineKeyById(id);

    if (!key) {
      parsed.unknownMappings.siegeMachines.push(id);
      continue;
    }

    parsed.siegeMachines[key] = level;
  }

  for (const building of raw.buildings ?? []) {
    const id = Number(building.data);

    if (!Number.isFinite(id)) continue;

    if (id === WALL_ID) {
      const level = Number(building.lvl);
      const count = Number(building.cnt ?? 0);

      if (!Number.isFinite(level) || !Number.isFinite(count)) continue;

      parsed.walls.byLevel[level] = (parsed.walls.byLevel[level] ?? 0) + count;
      parsed.walls.total += count;
      continue;
    }

    if (id === TOWNHALL_ID) {
      const level = Number(building.lvl);

      if (Number.isFinite(level)) {
        parsed.townHall = level;
      }

      continue;
    }
  }

  parsed.heroesCount = Object.keys(parsed.heroes).length;
  parsed.builderHeroesCount = Object.keys(parsed.builderHeroes).length;
  parsed.troopsCount = Object.keys(parsed.troops).length;
  parsed.spellsCount = Object.keys(parsed.spells).length;
  parsed.petsCount = Object.keys(parsed.pets).length;
  parsed.equipmentCount = Object.keys(parsed.equipment).length;
  parsed.siegeMachinesCount = Object.keys(parsed.siegeMachines).length;

  parsed.unknownMappings.heroes = uniqueNumbers(parsed.unknownMappings.heroes);
  parsed.unknownMappings.builderHeroes = uniqueNumbers(parsed.unknownMappings.builderHeroes);
  parsed.unknownMappings.troops = uniqueNumbers(parsed.unknownMappings.troops);
  parsed.unknownMappings.spells = uniqueNumbers(parsed.unknownMappings.spells);
  parsed.unknownMappings.pets = uniqueNumbers(parsed.unknownMappings.pets);
  parsed.unknownMappings.equipment = uniqueNumbers(parsed.unknownMappings.equipment);
  parsed.unknownMappings.siegeMachines = uniqueNumbers(parsed.unknownMappings.siegeMachines);
  parsed.unknownMappings.buildings = uniqueNumbers(parsed.unknownMappings.buildings);

  return parsed;
}

function uniqueNumbers(values) {
  return [...new Set((values ?? []).map((value) => Number(value)).filter(Number.isFinite))];
}