import fs from "fs";
import path from "path";
import { normalizeParsedVillage } from "./myIdResolverService.js";

const DATA_PATH = path.join(process.cwd(), "data", "coc_levels.json");

let LEVELS = null;
let INDEXES = null;

function loadLevels() {
  if (!LEVELS) {
    LEVELS = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  }

  return LEVELS;
}

function buildIndex(entries) {
  const map = new Map();

  for (const entry of entries ?? []) {
    if (!entry?.api_name) continue;
    map.set(String(entry.api_name).toLowerCase(), entry);
  }

  return map;
}

function resolveBuildingEntries(levels) {
  return (
    levels.buildings ??
    levels.home_buildings ??
    levels.village_buildings ??
    []
  );
}

function getIndexes() {
  if (!INDEXES) {
    const levels = loadLevels();

    INDEXES = {
      heroes: buildIndex(levels.heroes),
      troops: buildIndex(levels.troops),
      spells: buildIndex(levels.spells),
      pets: buildIndex(levels.pets),
      guards: buildIndex(levels.guards),
      sieges: buildIndex(levels.siege_machines),
      buildings: buildIndex(resolveBuildingEntries(levels))
    };
  }

  return INDEXES;
}

function clampPercent(current, max) {
  if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((current / max) * 100)));
}

function getMaxLevel(index, key, th) {
  if (!index || !key || !Number.isFinite(Number(th))) {
    return null;
  }

  const entry = index.get(String(key).toLowerCase());
  if (!entry?.max_by_hdv) {
    return null;
  }

  const exact = entry.max_by_hdv[String(th)];
  if (Number.isFinite(Number(exact))) {
    return Number(exact);
  }

  let best = null;

  for (const [hdvKey, maxValue] of Object.entries(entry.max_by_hdv)) {
    const hdv = Number(hdvKey);
    const max = Number(maxValue);

    if (!Number.isFinite(hdv) || !Number.isFinite(max)) continue;
    if (hdv > th) continue;

    if (best === null || hdv > best.hdv) {
      best = { hdv, max };
    }
  }

  return best?.max ?? null;
}

function computeProgressDetails(collection, index, th) {
  if (!collection || typeof collection !== "object") {
    return {
      percent: 0,
      current: 0,
      max: 0,
      matched: 0,
      ignored: 0
    };
  }

  let totalCurrent = 0;
  let totalMax = 0;
  let matched = 0;
  let ignored = 0;

  for (const [key, rawLevel] of Object.entries(collection)) {
    const level = Number(rawLevel);

    if (!Number.isFinite(level)) {
      ignored += 1;
      continue;
    }

    const max = getMaxLevel(index, key, th);

    if (!Number.isFinite(max) || max <= 0) {
      ignored += 1;
      continue;
    }

    totalCurrent += Math.min(level, max);
    totalMax += max;
    matched += 1;
  }

  return {
    percent: clampPercent(totalCurrent, totalMax),
    current: totalCurrent,
    max: totalMax,
    matched,
    ignored
  };
}

function getWallMaxLevel(levels, th) {
  const walls = levels.walls ?? [];

  let best = null;

  for (const entry of walls) {
    const level =
      Number(entry?.level ?? entry?.wall_level ?? entry?.upgrade_level ?? entry?.max_level);

    if (!Number.isFinite(level)) continue;

    if (entry?.max_by_hdv) {
      const exact = Number(entry.max_by_hdv[String(th)]);
      if (Number.isFinite(exact) && exact > 0) {
        best = Math.max(best ?? 0, exact);
        continue;
      }

      for (const [hdvKey, maxValue] of Object.entries(entry.max_by_hdv)) {
        const hdv = Number(hdvKey);
        const max = Number(maxValue);

        if (!Number.isFinite(hdv) || !Number.isFinite(max)) continue;
        if (hdv > th) continue;

        best = Math.max(best ?? 0, max);
      }

      continue;
    }

    const requiredTh =
      Number(entry?.townhallLevel ?? entry?.town_hall ?? entry?.required_townhall);

    if (Number.isFinite(requiredTh) && requiredTh <= th) {
      best = Math.max(best ?? 0, level);
    }
  }

  return best ?? 0;
}

function computeWallsProgress(parsed, th) {
  const levels = loadLevels();
  const wallCounts = parsed?.walls?.byLevel ?? parsed?.walls ?? {};
  const maxWallLevel = getWallMaxLevel(levels, th);

  let totalWalls = 0;
  let current = 0;

  for (const [levelKey, countValue] of Object.entries(wallCounts)) {
    if (levelKey === "total") continue;
    if (levelKey === "byLevel") continue;

    const level = Number(levelKey);
    const count = Number(countValue);

    if (!Number.isFinite(level) || !Number.isFinite(count) || count <= 0) continue;

    totalWalls += count;
    current += level * count;
  }

  const explicitTotal = Number(parsed?.walls?.total);
  if (Number.isFinite(explicitTotal) && explicitTotal > totalWalls) {
    totalWalls = explicitTotal;
  }

  const max = totalWalls * maxWallLevel;

  return {
    percent: clampPercent(current, max),
    current,
    max,
    matched: totalWalls,
    ignored: 0,
    maxLevel: maxWallLevel,
    totalWalls
  };
}

function flattenBuildings(buildings) {
  if (!buildings || typeof buildings !== "object") {
    return {};
  }

  if (Array.isArray(buildings)) {
    const mapped = {};
    for (const entry of buildings) {
      const key = String(entry?.api_name ?? entry?.name ?? entry?.key ?? "").toLowerCase();
      const level = Number(entry?.level);

      if (!key || !Number.isFinite(level)) continue;
      mapped[key] = level;
    }
    return mapped;
  }

  const output = {};

  for (const [key, value] of Object.entries(buildings)) {
    if (Number.isFinite(Number(value))) {
      output[String(key).toLowerCase()] = Number(value);
      continue;
    }

    if (value && typeof value === "object" && Number.isFinite(Number(value.level))) {
      output[String(key).toLowerCase()] = Number(value.level);
    }
  }

  return output;
}

function computeBuildingsProgress(parsed, th) {
  const indexes = getIndexes();
  const collection = flattenBuildings(parsed?.buildings);

  return computeProgressDetails(collection, indexes.buildings, th);
}

export function computeVillageProgress(parsedVillage, townHall) {
  const normalized = normalizeParsedVillage(parsedVillage);
  const th = Number(townHall ?? normalized?.townHall);
  const indexes = getIndexes();

  const heroes = computeProgressDetails(normalized?.heroes, indexes.heroes, th);
  const troops = computeProgressDetails(normalized?.troops, indexes.troops, th);
  const spells = computeProgressDetails(normalized?.spells, indexes.spells, th);
  const pets = computeProgressDetails(normalized?.pets, indexes.pets, th);
  const guards = computeProgressDetails(normalized?.guards, indexes.guards, th);
  const sieges = computeProgressDetails(normalized?.siegeMachines, indexes.sieges, th);
  const walls = computeWallsProgress(normalized, th);
  const buildings = computeBuildingsProgress(normalized, th);

  const globalCurrent =
    heroes.current +
    troops.current +
    spells.current +
    pets.current +
    guards.current +
    sieges.current +
    walls.current +
    buildings.current;

  const globalMax =
    heroes.max +
    troops.max +
    spells.max +
    pets.max +
    guards.max +
    sieges.max +
    walls.max +
    buildings.max;

  const overall = clampPercent(globalCurrent, globalMax);

  return {
    heroes: heroes.percent,
    troops: troops.percent,
    spells: spells.percent,
    pets: pets.percent,
    guards: guards.percent,
    sieges: sieges.percent,
    walls: walls.percent,
    buildings: buildings.percent,
    overall,
    details: {
      heroes,
      troops,
      spells,
      pets,
      guards,
      sieges,
      walls,
      buildings
    }
  };
}