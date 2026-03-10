import {
  resolveBuilderHeroKeyById,
  resolveGuardKeyById,
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
    guards: {},
    equipment: {},
    siegeMachines: {},

    walls: {
      total: 0,
      byLevel: {}
    },

    upgrades: [],

    heroesCount: 0,
    builderHeroesCount: 0,
    troopsCount: 0,
    spellsCount: 0,
    petsCount: 0,
    guardsCount: 0,
    equipmentCount: 0,
    siegeMachinesCount: 0,

    unknownMappings: {
      heroes: [],
      builderHeroes: [],
      troops: [],
      spells: [],
      pets: [],
      guards: [],
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
    pushTimedUpgrade(parsed.upgrades, hero, "heroes", key, level);
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
    pushTimedUpgrade(parsed.upgrades, hero, "builderHeroes", key, level);
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
    pushTimedUpgrade(parsed.upgrades, troop, "troops", key, level);
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
    pushTimedUpgrade(parsed.upgrades, spell, "spells", key, level);
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
    pushTimedUpgrade(parsed.upgrades, pet, "pets", key, level);
  }

  for (const guard of raw.guardians ?? []) {
    const id = Number(guard.data);
    const level = Number(guard.lvl);

    if (!Number.isFinite(id) || !Number.isFinite(level)) continue;

    const key = resolveGuardKeyById(id);

    if (!key) {
      parsed.unknownMappings.guards.push(id);
      continue;
    }

    parsed.guards[key] = level;
    pushTimedUpgrade(parsed.upgrades, guard, "guards", key, level);
  }

  for (const item of raw.equipment ?? []) {
    const id = Number(item.data);
    const level = Number(item.lvl);

    if (!Number.isFinite(id) || !Number.isFinite(level)) continue;

    parsed.equipment[String(id)] = level;
    parsed.unknownMappings.equipment.push(id);
    pushTimedUpgrade(parsed.upgrades, item, "equipment", String(id), level);
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
    pushTimedUpgrade(parsed.upgrades, siege, "sieges", key, level);
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
    }

    pushTimedUpgrade(parsed.upgrades, building, "buildings", String(id), Number(building.lvl));
  }

  for (const trap of raw.traps ?? []) {
    pushTimedUpgrade(parsed.upgrades, trap, "traps", String(trap.data ?? ""), Number(trap.lvl));
  }

  parsed.heroesCount = Object.keys(parsed.heroes).length;
  parsed.builderHeroesCount = Object.keys(parsed.builderHeroes).length;
  parsed.troopsCount = Object.keys(parsed.troops).length;
  parsed.spellsCount = Object.keys(parsed.spells).length;
  parsed.petsCount = Object.keys(parsed.pets).length;
  parsed.guardsCount = Object.keys(parsed.guards).length;
  parsed.equipmentCount = Object.keys(parsed.equipment).length;
  parsed.siegeMachinesCount = Object.keys(parsed.siegeMachines).length;

  parsed.unknownMappings.heroes = uniqueNumbers(parsed.unknownMappings.heroes);
  parsed.unknownMappings.builderHeroes = uniqueNumbers(parsed.unknownMappings.builderHeroes);
  parsed.unknownMappings.troops = uniqueNumbers(parsed.unknownMappings.troops);
  parsed.unknownMappings.spells = uniqueNumbers(parsed.unknownMappings.spells);
  parsed.unknownMappings.pets = uniqueNumbers(parsed.unknownMappings.pets);
  parsed.unknownMappings.guards = uniqueNumbers(parsed.unknownMappings.guards);
  parsed.unknownMappings.equipment = uniqueNumbers(parsed.unknownMappings.equipment);
  parsed.unknownMappings.siegeMachines = uniqueNumbers(parsed.unknownMappings.siegeMachines);
  parsed.unknownMappings.buildings = uniqueNumbers(parsed.unknownMappings.buildings);

  parsed.upgrades = dedupeUpgrades(parsed.upgrades);

  return parsed;
}

function pushTimedUpgrade(target, sourceItem, category, key, level) {
  const timer = Number(sourceItem?.timer ?? sourceItem?.time ?? 0);
  const helperTimer = Number(sourceItem?.helper_timer ?? 0);
  const helperCooldown = Number(sourceItem?.helper_cooldown ?? 0);

  if (timer <= 0 && helperTimer <= 0 && helperCooldown <= 0) {
    return;
  }

  target.push({
    category,
    key,
    level: Number.isFinite(Number(level)) ? Number(level) : null,
    timer: Number.isFinite(timer) ? timer : 0,
    helperTimer: Number.isFinite(helperTimer) ? helperTimer : 0,
    helperCooldown: Number.isFinite(helperCooldown) ? helperCooldown : 0
  });
}

function dedupeUpgrades(items) {
  const seen = new Set();
  const result = [];

  for (const item of items ?? []) {
    const signature = [
      item.category,
      item.key,
      item.level,
      item.timer,
      item.helperTimer,
      item.helperCooldown
    ].join(":");

    if (seen.has(signature)) continue;
    seen.add(signature);
    result.push(item);
  }

  return result;
}

function uniqueNumbers(values) {
  return [...new Set((values ?? []).map((value) => Number(value)).filter(Number.isFinite))];
}