/src/services/myProgressService.js
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "coc_levels.json");

let LEVELS = null;

function loadLevels() {
  if (!LEVELS) {
    LEVELS = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  }
  return LEVELS;
}

function getMaxLevel(mapping, key, th) {

  const entry = mapping.find(e => e.api_name === key);

  if (!entry) return null;

  const table = entry.max_by_hdv;

  if (!table) return null;

  return table[String(th)] ?? null;
}

function computeProgress(collection, mapping, th) {

  if (!collection || typeof collection !== "object") {
    return 0;
  }

  let totalCurrent = 0;
  let totalMax = 0;

  for (const [key, level] of Object.entries(collection)) {

    const max = getMaxLevel(mapping, key, th);

    if (!max) continue;

    const lvl = Number(level);

    if (!Number.isFinite(lvl)) continue;

    totalCurrent += lvl;
    totalMax += max;
  }

  if (totalMax === 0) return 0;

  return Math.round((totalCurrent / totalMax) * 100);
}

export function computeVillageProgress(parsedVillage, townHall) {

  const levels = loadLevels();

  return {

    heroes: computeProgress(
      parsedVillage.heroes,
      levels.heroes,
      townHall
    ),

    troops: computeProgress(
      parsedVillage.troops,
      levels.troops,
      townHall
    ),

    spells: computeProgress(
      parsedVillage.spells,
      levels.spells,
      townHall
    ),

    pets: computeProgress(
      parsedVillage.pets,
      levels.pets,
      townHall
    ),

    sieges: computeProgress(
      parsedVillage.siegeMachines,
      levels.siege_machines,
      townHall
    )

  };
}