const HERO_ID_MAP = {
    28000000: "barbarianking",
    28000001: "archerqueen",
    28000002: "grandwarden",
    28000004: "royalchampion",
    28000006: "minionprince"
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