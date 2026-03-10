/src/services/myIdResolverService.js
const HERO_ID_MAP = {
  28000000: "barbarianking",
  28000001: "archerqueen",
  28000002: "grandwarden",
  28000004: "royalchampion",
  28000006: "minionprince",
  28000007: "dragonduke"
};

const BUILDER_HERO_ID_MAP = {
  28000003: "battlemachine",
  28000005: "battlecopter"
};

const TROOP_ID_MAP = {
  4000000: "barbarian",
  4000001: "archer",
  4000002: "giant",
  4000003: "goblin",
  4000004: "wallbreaker",
  4000005: "balloon",
  4000006: "wizard",
  4000007: "healer",
  4000008: "dragon",
  4000009: "pekka",
  4000010: "babydragon",
  4000011: "miner",
  4000012: "electrodragon",
  4000013: "yeti",
  4000015: "dragonrider",
  4000017: "electrotitan",
  4000022: "rootrider",
  4000023: "thrower",
  4000024: "meteoritegolem",
  4000053: "minion",
  4000058: "hogrider",
  4000059: "valkyrie",
  4000065: "golem",
  4000082: "witch",
  4000095: "lavahound",
  4000097: "bowler",
  4000110: "icegolem",
  4000123: "headhunter",
  4000132: "apprenticewarden",
  4000150: "druid",
  4000177: "furnace"
};

const SPELL_ID_MAP = {
  26000000: "lightning",
  26000001: "heal",
  26000002: "rage",
  26000003: "jump",
  26000005: "freeze",
  26000009: "clone",
  26000010: "poison",
  26000011: "earthquake",
  26000016: "haste",
  26000017: "skeleton",
  26000028: "bat",
  26000035: "invisibility",
  26000053: "recallspell",
  26000070: "overgrowth",
  26000098: "revive",
  26000109: "totem",
  26000120: "iceblock"
};

const PET_ID_MAP = {
  73000000: "lassi",
  73000001: "electroowl",
  73000002: "mightyyak",
  73000003: "unicorn",
  73000004: "frosty",
  73000007: "diggy",
  73000008: "poisonlizard",
  73000009: "phoenix",
  73000010: "spiritfox",
  73000011: "angryjelly",
  73000016: "sneezy"
};

const SIEGE_MACHINE_ID_MAP = {
  4000051: "wallwrecker",
  4000052: "battleblimp",
  4000062: "stoneslammer",
  4000075: "siegebarracks",
  4000087: "loglauncher",
  4000091: "flameflinger",
  4000092: "battledrill",
  4000135: "trooplauncher"
};

const GUARD_ID_MAP = {
  107000000: "longshot",
  107000001: "smasher"
};

const HERO_LEGACY_KEY_MAP = {
  barbarianking: "barbarianking",
  archerqueen: "archerqueen",
  grandwarden: "grandwarden",
  royalchampion: "royalchampion",
  minionprince: "minionprince",
  dragonduke: "dragonduke",
  unknownhero28000007: "dragonduke",
  battlemachine: "battlemachine",
  battlecopter: "battlecopter"
};

const TROOP_LEGACY_KEY_MAP = {
  barbarian: "barbarian",
  archer: "archer",
  giant: "giant",
  goblin: "goblin",
  wallbreaker: "wallbreaker",
  balloon: "balloon",
  wizard: "wizard",
  healer: "healer",
  dragon: "dragon",
  pekka: "pekka",
  babydragon: "babydragon",
  miner: "miner",
  electrodragon: "electrodragon",
  yeti: "yeti",
  dragonrider: "dragonrider",
  electrotitan: "electrotitan",
  rootrider: "rootrider",
  thrower: "thrower",
  meteoritegolem: "meteoritegolem",
  minion: "minion",
  hogrider: "hogrider",
  valkyrie: "valkyrie",
  golem: "golem",
  witch: "witch",
  lavahound: "lavahound",
  bowler: "bowler",
  icegolem: "icegolem",
  headhunter: "headhunter",
  apprenticewarden: "apprenticewarden",
  druid: "druid",
  furnace: "furnace"
};

const SPELL_LEGACY_KEY_MAP = {
  lightning: "lightning",
  lightningspell: "lightning",
  heal: "heal",
  healspell: "heal",
  rage: "rage",
  ragespell: "rage",
  jump: "jump",
  jumpspell: "jump",
  freeze: "freeze",
  freezespell: "freeze",
  clone: "clone",
  clonespell: "clone",
  invisibility: "invisibility",
  invisibilityspell: "invisibility",
  recall: "recallspell",
  recallspell: "recallspell",
  revive: "revive",
  revivespell: "revive",
  totem: "totem",
  poison: "poison",
  poisonspell: "poison",
  earthquake: "earthquake",
  earthquakespell: "earthquake",
  haste: "haste",
  hastespell: "haste",
  skeleton: "skeleton",
  skeletonspell: "skeleton",
  bat: "bat",
  batspell: "bat",
  overgrowth: "overgrowth",
  overgrowthspell: "overgrowth",
  iceblock: "iceblock"
};

const PET_LEGACY_KEY_MAP = {
  lassi: "lassi",
  electroowl: "electroowl",
  mightyyak: "mightyyak",
  unicorn: "unicorn",
  frosty: "frosty",
  diggy: "diggy",
  poisonlizard: "poisonlizard",
  phoenix: "phoenix",
  spiritfox: "spiritfox",
  angryjelly: "angryjelly",
  sneezy: "sneezy"
};

const SIEGE_LEGACY_KEY_MAP = {
  wallwrecker: "wallwrecker",
  battleblimp: "battleblimp",
  stoneslammer: "stoneslammer",
  siegebarracks: "siegebarracks",
  loglauncher: "loglauncher",
  flameflinger: "flameflinger",
  battledrill: "battledrill",
  trooplauncher: "trooplauncher"
};

const GUARD_LEGACY_KEY_MAP = {
  longshot: "longshot",
  smasher: "smasher"
};

export function resolveHeroKeyById(id) {
  return HERO_ID_MAP[Number(id)] ?? null;
}

export function resolveBuilderHeroKeyById(id) {
  return BUILDER_HERO_ID_MAP[Number(id)] ?? null;
}

export function resolveTroopKeyById(id) {
  return TROOP_ID_MAP[Number(id)] ?? null;
}

export function resolveSpellKeyById(id) {
  return SPELL_ID_MAP[Number(id)] ?? null;
}

export function resolvePetKeyById(id) {
  return PET_ID_MAP[Number(id)] ?? null;
}

export function resolveSiegeMachineKeyById(id) {
  return SIEGE_MACHINE_ID_MAP[Number(id)] ?? null;
}

export function resolveGuardKeyById(id) {
  return GUARD_ID_MAP[Number(id)] ?? null;
}

export function normalizeParsedVillage(parsedVillage) {
  if (!parsedVillage || typeof parsedVillage !== "object") {
    return parsedVillage;
  }

  return {
    ...parsedVillage,
    heroes: normalizeCollection(parsedVillage.heroes, "heroes"),
    builderHeroes: normalizeCollection(parsedVillage.builderHeroes, "builderHeroes"),
    troops: normalizeCollection(parsedVillage.troops, "troops"),
    spells: normalizeCollection(parsedVillage.spells, "spells"),
    pets: normalizeCollection(parsedVillage.pets, "pets"),
    guards: normalizeCollection(parsedVillage.guards, "guards"),
    siegeMachines: normalizeCollection(parsedVillage.siegeMachines, "sieges"),
    equipment: normalizeCollection(parsedVillage.equipment, "equipment"),
    upgrades: Array.isArray(parsedVillage.upgrades)
      ? parsedVillage.upgrades.map((upgrade) => normalizeUpgrade(upgrade))
      : []
  };
}

export function normalizeCollection(collection, category) {
  if (!collection || typeof collection !== "object") {
    return {};
  }

  const normalized = {};

  for (const [rawKey, rawLevel] of Object.entries(collection)) {
    const level = Number(rawLevel);

    if (!Number.isFinite(level)) {
      continue;
    }

    const key = normalizeKeyByCategory(rawKey, category);

    if (!key) {
      normalized[String(rawKey)] = level;
      continue;
    }

    normalized[key] = Math.max(Number(normalized[key] ?? 0), level);
  }

  return normalized;
}

function normalizeUpgrade(upgrade) {
  if (!upgrade || typeof upgrade !== "object") {
    return upgrade;
  }

  const category = normalizeUpgradeCategory(upgrade.category);
  const key = normalizeKeyByCategory(upgrade.key, category);

  return {
    ...upgrade,
    category,
    key: key ?? String(upgrade.key ?? ""),
    level: Number.isFinite(Number(upgrade.level)) ? Number(upgrade.level) : null,
    timer: Number.isFinite(Number(upgrade.timer)) ? Number(upgrade.timer) : 0,
    helperTimer: Number.isFinite(Number(upgrade.helperTimer)) ? Number(upgrade.helperTimer) : 0,
    helperCooldown: Number.isFinite(Number(upgrade.helperCooldown))
      ? Number(upgrade.helperCooldown)
      : 0
  };
}

function normalizeUpgradeCategory(category) {
  const value = String(category ?? "").trim().toLowerCase();

  if (value === "sieges" || value === "siegemachines" || value === "siege_machines") {
    return "sieges";
  }

  if (value === "builderheroes" || value === "builder_heroes") {
    return "builderHeroes";
  }

  return value;
}

function normalizeKeyByCategory(rawKey, category) {
  if (rawKey === null || rawKey === undefined) {
    return null;
  }

  const numericId = Number(rawKey);
  const hasNumericId = Number.isFinite(numericId) && String(rawKey).trim() !== "";

  if (category === "heroes") {
    if (hasNumericId) return resolveHeroKeyById(numericId);
    return HERO_LEGACY_KEY_MAP[normalizeTextKey(rawKey)] ?? normalizeTextKey(rawKey);
  }

  if (category === "builderHeroes") {
    if (hasNumericId) return resolveBuilderHeroKeyById(numericId);
    return HERO_LEGACY_KEY_MAP[normalizeTextKey(rawKey)] ?? normalizeTextKey(rawKey);
  }

  if (category === "troops") {
    if (hasNumericId) return resolveTroopKeyById(numericId);
    return TROOP_LEGACY_KEY_MAP[normalizeTextKey(rawKey)] ?? normalizeTextKey(rawKey);
  }

  if (category === "spells") {
    if (hasNumericId) return resolveSpellKeyById(numericId);
    return SPELL_LEGACY_KEY_MAP[normalizeTextKey(rawKey)] ?? normalizeTextKey(rawKey);
  }

  if (category === "pets") {
    if (hasNumericId) return resolvePetKeyById(numericId);
    return PET_LEGACY_KEY_MAP[normalizeTextKey(rawKey)] ?? normalizeTextKey(rawKey);
  }

  if (category === "guards") {
    if (hasNumericId) return resolveGuardKeyById(numericId);
    return GUARD_LEGACY_KEY_MAP[normalizeTextKey(rawKey)] ?? normalizeTextKey(rawKey);
  }

  if (category === "sieges") {
    if (hasNumericId) return resolveSiegeMachineKeyById(numericId);
    return SIEGE_LEGACY_KEY_MAP[normalizeTextKey(rawKey)] ?? normalizeTextKey(rawKey);
  }

  if (category === "equipment") {
    return normalizeTextKey(rawKey);
  }

  return normalizeTextKey(rawKey);
}

function normalizeTextKey(value) {
  return String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s\-]+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/_/g, "")
    .toLowerCase();
}