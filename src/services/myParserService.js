/src/services/myParserService.js
export function parsePlayerExport(raw) {

  const parsed = {
    playerTag: raw.tag ?? null,
    playerName: raw.name ?? null,

    townHall: null,

    heroes: {},
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
    troopsCount: 0,
    spellsCount: 0,
    petsCount: 0,
    equipmentCount: 0,
    siegeMachinesCount: 0,

    unknownMappings: {
      heroes: [],
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

  /* HEROES */

  for (const hero of raw.heroes ?? []) {

    const id = Number(hero.data);
    const level = Number(hero.lvl);

    parsed.heroes[id] = level;

  }

  /* TROOPS */

  for (const troop of raw.units ?? []) {

    const id = Number(troop.data);
    const level = Number(troop.lvl);

    parsed.troops[id] = level;

  }

  /* SPELLS */

  for (const spell of raw.spells ?? []) {

    const id = Number(spell.data);
    const level = Number(spell.lvl);

    parsed.spells[id] = level;

  }

  /* PETS */

  for (const pet of raw.pets ?? []) {

    const id = Number(pet.data);
    const level = Number(pet.lvl);

    parsed.pets[id] = level;

  }

  /* EQUIPMENT */

  for (const item of raw.equipment ?? []) {

    const id = Number(item.data);
    const level = Number(item.lvl);

    parsed.equipment[id] = level;

  }

  /* SIEGE MACHINES */

  for (const siege of raw.siege_machines ?? []) {

    const id = Number(siege.data);
    const level = Number(siege.lvl);

    parsed.siegeMachines[id] = level;

  }

  /* BUILDINGS */

  for (const building of raw.buildings ?? []) {

    const id = Number(building.data);

    if (id === WALL_ID) {

      const level = Number(building.lvl);
      const count = Number(building.cnt ?? 0);

      parsed.walls.byLevel[level] =
        (parsed.walls.byLevel[level] ?? 0) + count;

      parsed.walls.total += count;

      continue;

    }

    if (id === TOWNHALL_ID) {

      parsed.townHall = Number(building.lvl);

      continue;

    }

  }

  /* COUNTS */

  parsed.heroesCount = Object.keys(parsed.heroes).length;
  parsed.troopsCount = Object.keys(parsed.troops).length;
  parsed.spellsCount = Object.keys(parsed.spells).length;
  parsed.petsCount = Object.keys(parsed.pets).length;
  parsed.equipmentCount = Object.keys(parsed.equipment).length;
  parsed.siegeMachinesCount = Object.keys(parsed.siegeMachines).length;

  return parsed;

}