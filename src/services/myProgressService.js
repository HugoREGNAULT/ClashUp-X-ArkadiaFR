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

function getIndexes() {
  if (!INDEXES) {
    const levels = loadLevels();

    INDEXES = {
      heroes: buildIndex(levels.heroes),
      troops: buildIndex(levels.troops),
      spells: buildIndex(levels.spells),
      pets: buildIndex(levels.pets),
      guards: buildIndex(levels.guards),
      sieges: buildIndex(levels.siege_machines)
    };
  }

  return INDEXES;
}

function getMaxLevel(index, key, th) {
  if (!index || !key || !Number.isFinite(Number(th))) {
    return null;
  }

  const entry = index.get(String(key).toLowerCase());

  if (!entry?.max_by_hdv) {
    return null;
  }

  const max = entry.max_by_hdv[String(th)];

  return Number.isFinite(Number(max)) ? Number(max) : null;
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

  const percent =
    totalMax > 0
      ? Math.max(0, Math.min(100, Math.round((totalCurrent / totalMax) * 100)))
      : 0;

  return {
    percent,
    current: totalCurrent,
    max: totalMax,
    matched,
    ignored
  };
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

  const globalCurrent =
    heroes.current +
    troops.current +
    spells.current +
    pets.current +
    guards.current +
    sieges.current;

  const globalMax =
    heroes.max +
    troops.max +
    spells.max +
    pets.max +
    guards.max +
    sieges.max;

  const overall =
    globalMax > 0
      ? Math.max(0, Math.min(100, Math.round((globalCurrent / globalMax) * 100)))
      : 0;

  return {
    heroes: heroes.percent,
    troops: troops.percent,
    spells: spells.percent,
    pets: pets.percent,
    guards: guards.percent,
    sieges: sieges.percent,
    overall,
    details: {
      heroes,
      troops,
      spells,
      pets,
      guards,
      sieges
    }
  };
}