import { HERO_NAME_ALIASES, BUILDER_BASE_HEROES } from "../constants/cocMappings/heroes.js";
import { PET_NAME_ALIASES } from "../constants/cocMappings/pets.js";
import { EQUIPMENT_NAME_ALIASES } from "../constants/cocMappings/equipment.js";
import { BUILDING_NAME_ALIASES } from "../constants/cocMappings/buildings.js";
import { TROOP_NAME_ALIASES } from "../constants/cocMappings/troops.js";
import { SPELL_NAME_ALIASES } from "../constants/cocMappings/spells.js";
import { SIEGE_MACHINE_NAME_ALIASES } from "../constants/cocMappings/siegeMachines.js";

export function parsePlayerExport(payload, discordId) {
  const root = resolvePlayerRoot(payload);

  const playerTag = normalizeTag(
    readFirstDefined(root, ["tag", "playerTag", "player_tag"]) ??
      readFirstDefined(payload, ["tag", "playerTag", "player_tag"]) ??
      "#UNKNOWN"
  );

  const playerName =
    readFirstDefined(root, ["name", "playerName", "username"]) ??
    readFirstDefined(payload, ["name", "playerName", "username"]) ??
    null;

  const townHall =
    toNumber(readFirstDefined(root, ["townHallLevel", "townHall", "thLevel", "townhall"])) ??
    inferTownHallFromBuildings(root);

  const heroesSource = [
    ...normalizeCollection(root.heroes),
    ...normalizeCollection(root.heroes2),
    ...normalizeCollection(root.heroList),
    ...normalizeCollection(root.builderHeroes)
  ];

  const petsSource = [
    ...normalizeCollection(root.pets),
    ...normalizeCollection(root.heroPets),
    ...normalizeCollection(root.petList)
  ];

  const equipmentSource = [
    ...normalizeCollection(root.equipment),
    ...normalizeCollection(root.heroEquipment),
    ...normalizeCollection(root.equipments)
  ];

  const troopsSource = [
    ...normalizeCollection(root.troops),
    ...normalizeCollection(root.homeTroops),
    ...normalizeCollection(root.armyTroops),
    ...normalizeCollection(root.units)
  ];

  const spellsSource = [
    ...normalizeCollection(root.spells),
    ...normalizeCollection(root.spellList),
    ...normalizeCollection(root.magic)
  ];

  const siegeMachinesSource = [
    ...normalizeCollection(root.siegeMachines),
    ...normalizeCollection(root.sieges),
    ...normalizeCollection(root.workshopTroops)
  ];

  const buildingsSource = [
    ...normalizeCollection(root.buildings),
    ...normalizeCollection(root.homeBuildings),
    ...normalizeCollection(root.villageObjects),
    ...normalizeCollection(root.structures)
  ];

  const heroesResult = parseLeveledCollection(heroesSource, HERO_NAME_ALIASES);
  const petsResult = parseLeveledCollection(petsSource, PET_NAME_ALIASES);
  const equipmentResult = parseLeveledCollection(equipmentSource, EQUIPMENT_NAME_ALIASES);
  const troopsResult = parseLeveledCollection(troopsSource, TROOP_NAME_ALIASES);
  const spellsResult = parseLeveledCollection(spellsSource, SPELL_NAME_ALIASES);
  const siegeMachinesResult = parseLeveledCollection(siegeMachinesSource, SIEGE_MACHINE_NAME_ALIASES);
  const buildingsAndWallsResult = parseBuildingsAndWalls(buildingsSource);

  const heroes = {};
  const builderBase = {};

  for (const [name, level] of Object.entries(heroesResult.values)) {
    if (BUILDER_BASE_HEROES.has(name)) {
      builderBase[name] = level;
    } else {
      heroes[name] = level;
    }
  }

  return {
    discordId: String(discordId),
    playerTag,
    playerName,
    townHall: townHall ?? null,
    heroes,
    heroesCount: Object.keys(heroes).length,
    builderBase,
    builderBaseHeroesCount: Object.keys(builderBase).length,
    pets: petsResult.values,
    petsCount: Object.keys(petsResult.values).length,
    equipment: equipmentResult.values,
    equipmentCount: Object.keys(equipmentResult.values).length,
    troops: troopsResult.values,
    troopsCount: Object.keys(troopsResult.values).length,
    spells: spellsResult.values,
    spellsCount: Object.keys(spellsResult.values).length,
    siegeMachines: siegeMachinesResult.values,
    siegeMachinesCount: Object.keys(siegeMachinesResult.values).length,
    buildings: buildingsAndWallsResult.values,
    buildingsCount: Object.keys(buildingsAndWallsResult.values).length,
    walls: buildingsAndWallsResult.walls,
    unknownMappings: {
      heroes: heroesResult.unknown,
      pets: petsResult.unknown,
      equipment: equipmentResult.unknown,
      troops: troopsResult.unknown,
      spells: spellsResult.unknown,
      siegeMachines: siegeMachinesResult.unknown,
      buildings: buildingsAndWallsResult.unknown
    },
    sourceMeta: {
      heroesEntries: heroesSource.length,
      petsEntries: petsSource.length,
      equipmentEntries: equipmentSource.length,
      troopsEntries: troopsSource.length,
      spellsEntries: spellsSource.length,
      siegeMachinesEntries: siegeMachinesSource.length,
      buildingsEntries: buildingsSource.length
    },
    rawSummary: {
      keys: Object.keys(root)
    },
    lastSyncAt: new Date().toISOString()
  };
}

function resolvePlayerRoot(payload) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  if (looksLikePlayerRoot(payload)) {
    return payload;
  }

  const candidateKeys = ["player", "data", "village", "profile", "homeVillage", "export", "account"];

  for (const key of candidateKeys) {
    const candidate = payload[key];
    if (candidate && typeof candidate === "object" && looksLikePlayerRoot(candidate)) {
      return candidate;
    }
  }

  return payload;
}

function looksLikePlayerRoot(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (typeof value.tag === "string" || typeof value.playerTag === "string") {
    return true;
  }

  return [
    "heroes",
    "heroes2",
    "pets",
    "equipment",
    "troops",
    "spells",
    "siegeMachines",
    "buildings"
  ].some((key) => key in value);
}

function parseLeveledCollection(entries, aliasMap) {
  const values = {};
  const unknown = [];

  for (const entry of entries) {
    const canonicalName = resolveCanonicalName(entry, aliasMap);
    const level = resolveLevel(entry);

    if (!canonicalName || level == null) {
      continue;
    }

    if (canonicalName.startsWith("unknown:")) {
      unknown.push({
        key: canonicalName.replace("unknown:", ""),
        level
      });
      continue;
    }

    values[canonicalName] = level;
  }

  return {
    values,
    unknown
  };
}

function parseBuildingsAndWalls(entries) {
  const values = {};
  const unknown = [];
  const wallLevels = {};

  for (const entry of entries) {
    const canonicalName = resolveCanonicalName(entry, BUILDING_NAME_ALIASES);
    const level = resolveLevel(entry);

    if (!canonicalName || level == null) {
      continue;
    }

    if (canonicalName.startsWith("unknown:")) {
      unknown.push({
        key: canonicalName.replace("unknown:", ""),
        level
      });
      continue;
    }

    if (canonicalName === "wall") {
      wallLevels[level] = (wallLevels[level] || 0) + 1;
      continue;
    }

    values[canonicalName] = level;
  }

  return {
    values,
    unknown,
    walls: {
      total: Object.values(wallLevels).reduce((sum, count) => sum + count, 0),
      byLevel: wallLevels
    }
  };
}

function resolveCanonicalName(entry, aliasMap) {
  const candidates = [
    entry?.name,
    entry?.label,
    entry?.type,
    entry?.building,
    entry?.hero,
    entry?.pet,
    entry?.equipment,
    entry?.troop,
    entry?.spell,
    entry?.siege,
    entry?.villageObject,
    entry?.id,
    entry?.globalId,
    entry?.itemId,
    entry?.__key
  ]
    .filter(Boolean)
    .map((value) => normalizeAliasKey(String(value)));

  for (const candidate of candidates) {
    if (aliasMap[candidate]) {
      return aliasMap[candidate];
    }
  }

  if (candidates.length > 0) {
    return `unknown:${candidates[0]}`;
  }

  return null;
}

function resolveLevel(entry) {
  const possibleValues = [
    entry?.level,
    entry?.lvl,
    entry?.currentLevel,
    entry?.Level,
    entry?.value
  ];

  for (const value of possibleValues) {
    const number = toNumber(value);
    if (number != null) {
      return number;
    }
  }

  return null;
}

function inferTownHallFromBuildings(root) {
  const buildings = normalizeCollection(root.buildings);

  for (const building of buildings) {
    const canonical = resolveCanonicalName(building, BUILDING_NAME_ALIASES);
    if (canonical === "townHall") {
      return resolveLevel(building);
    }
  }

  return null;
}

function normalizeCollection(source) {
  if (!source) return [];

  if (Array.isArray(source)) {
    return source.filter((item) => item && typeof item === "object");
  }

  if (typeof source === "object") {
    return Object.entries(source).map(([key, value]) => {
      if (value && typeof value === "object") {
        return {
          __key: key,
          ...value
        };
      }

      return {
        __key: key,
        value
      };
    });
  }

  return [];
}

function readFirstDefined(target, keys) {
  if (!target || typeof target !== "object") return null;

  for (const key of keys) {
    if (target[key] !== undefined && target[key] !== null) {
      return target[key];
    }
  }

  return null;
}

function normalizeTag(value) {
  return String(value || "#UNKNOWN")
    .trim()
    .toUpperCase()
    .replace(/[^#A-Z0-9]/g, "")
    .replace(/^(?!#)/, "#");
}

function normalizeAliasKey(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}