// /src/constants/myEmojis.js
const FALLBACK = "❌";

export const MY_EMOJIS = {
  misc: {
    profile: "👤",
    level: "⭐",
    clan: "🏰",
    league: "🏆",
    import: "📥",
    upgrades: "⬆️"
  },

  townHall: {
    "18": "<:HV18:1465751133371764883>",
    "17": "<:HV17:1465751131949891737>",
    "16": "<:HV16:1465751130473762826>",
    "15": "<:HV15:1465751128628138015>",
    "14": "<:HV14:1465751126652621077>",
    "13": "<:HV13:1465751124328972412>",
    "12": "<:HV12:1465751123578327203>",
    "11": "<:HV11:1465751121414062101>",
    "10": "<:HV10:1465751120222621850>",
    "9": "<:HV9:1465751118473593077>"
  }
};

export const MY_PROFILE_EMOJIS = {
  heroes: {
    barbarianking: "<:barbarianking:1138953623884267520>",
    archerqueen: "<:Queen:700065300137246790>",
    grandwarden: "<:warden_v2:1437860354603614268>",
    royalchampion: "<:Championne:930155420998307880>",
    minionprince: "<:HERO_PrinceMinion:1443691863193161788>",
    dragonduke: "<:HERO_DragonDuke:1480981007749480459>"
  },

  builderHeroes: {
    battlemachine: "⚙️",
    battlecopter: "🚁"
  },

  troops: {
    barbarian: "<:Barbare:930155421065425007>",
    archer: "<:archer:1155943729882988654>",
    giant: "<:COM_Geant:1341452860864467040>",
    goblin: "<:Gobelin:1439352068589621559>",
    wallbreaker: "<:COM_Sapeur:1341453172023230515>",
    balloon: "<:Ballon:930168022856003684>",
    wizard: "<:Sorcier:930168022348476476>",
    healer: "<:Guerisseuse:930168022558203925>",
    dragon: "<:Dragon:930168022193291345>",
    pekka: "<:Pekka:930168022583373874>",
    babydragon: "<:Bebe_dragon:1439353003403513916>",
    miner: "<:Mineur:930155421174464563>",
    electrodragon: "<:COM_ElectroDragon:1341452786574823516>",
    yeti: "<:Yeti:930168022537211934>",
    dragonrider: "<:Chevaucheur_dragon:1439353181376090323>",
    electrotitan: "<:COM_ElectroTitanide:1346166834990153728>",
    rootrider: "<:COM_Racine:1346166959355723857>",
    thrower: "<:Cyclope:1468671068116881601>",
    meteoritegolem: "<:Golem_meteorique:1439991075694706688>",
    minion: "<:Gargouille:930168022570766356>",
    hogrider: "<:ChevaucheurCochon:930168022281359450>",
    valkyrie: "<:Valkyrie:1439358215128220024>",
    golem: "<:Golem:1439358243305558017>",
    witch: "<:witch:288380845830438923>",
    lavahound: "<:Molosse:930168022629507102>",
    bowler: "<:Bouliste:930168022453321769>",
    icegolem: "<:Golem_glace:1439358729387638984>",
    headhunter: "<:COM_Chasseuse:1341452363977850952>",
    apprenticewarden: "<:Apprenti_gardien:1439358796840439859>",
    druid: "<:COM_Druide:1346167322808942674>",
    furnace: "<:Fournaise:1439358988323000360>"
  },

  spells: {
    lightning: "<:Foudre:1437897589914599455>",
    heal: "<:Soin:1437897904823075017>",
    rage: "<:Rage:1437897807565426828>",
    jump: "<:Saut:930168688039047198>",
    freeze: "<:Gel:1437897615642591324>",
    clone: "<:Clonage:1437897545748709611>",
    invisibility: "<:Invisibilite:930168687997104148>",
    recallspell: "<:Rappel:1437897834031611944>",
    revive: "<:Resurrection:1437897859155492985>",
    totem: "<:Totem:1439945061893935114>",
    poison: "<:Poison:1437897786057293884>",
    earthquake: "<:Seisme:1437897957684023347>",
    haste: "<:Precipitation:930168687930015825>",
    skeleton: "<:Squelettique:930168687397318677>",
    bat: "<:ChauveSouris:930168688097779752>",
    overgrowth: "<:Floraison:1437897568011948044>",
    iceblock: "<:Bloc_glace:1437897475611558009>"
  },

  pets: {
    lassi: "<:Lassi:930153412434231306>",
    electroowl: "<:Electro_chouette:1437884331300360343>",
    mightyyak: "<:Yak_roubuste:1437884781634523166>",
    unicorn: "<:Licorne:1437884516520824924>",
    frosty: "<:frostyhuh:1133418322675900456>",
    diggy: "<:Pablo:1437884579582050344>",
    poisonlizard: "<:Lezard_letal:1437884481158779010>",
    phoenix: "<:Phenix:1437884627237998622>",
    spiritfox: "<:Renard_spirituel:1437884688453734542>",
    angryjelly: "<:Meduse_colerique:1437884552923189309>",
    sneezy: "<:Atchoum:1437884231513538572>",
    unknownpet_73000017: "<:9_:1481036628754567290>"
  },

  sieges: {
    wallwrecker: "<:Demolisseur:930152190230814810>",
    battleblimp: "<:dirigeable:455320596000276480>",
    stoneslammer: "<:BroyeurPierre:930152191275171860>",
    siegebarracks: "<:CaserneSiege:930152191153537054>",
    loglauncher: "<:LanceBuche:930152190453088266>",
    flameflinger: "<:CatapulteEsprits:930153120061882448>",
    battledrill: "<:ENGIN_MachineMinig:1443682027445682287>",
    trooplauncher: "<:ENGIN_TroopLauncher:1443681617481699349>"
  },

  guards: {
    longshot: "<:Artilleuse:1472710443083632701>",
    smasher: "<:Destructeur:1472710395327418631>"
  },

  equipment: {
    giantgauntlet: "🧤",
    ragevial: "🧪",
    vampstache: "🧛",
    earthquakeboots: "🥾",
    spikyball: "⚽",
    invisibilityvial: "👻",
    frozenarrow: "❄️",
    archerpuppet: "🏹",
    healerpuppet: "💖",
    magicmirror: "🪞",
    eternaltome: "📖",
    healingtome: "📘",
    ragegem: "💎",
    lifegem: "💚",
    fireball: "🔥",
    royalgem: "💎",
    seekingshield: "🛡️",
    hogriderpuppet: "🐗",
    hastevial: "💨",
    electroboots: "⚡",
    rocketshield: "🚀"
  }
};

export function getEmoji(category, key) {
  if (!category) return FALLBACK;

  const group = MY_EMOJIS[category];
  if (!group) return FALLBACK;

  const emoji = group[String(key)];
  return emoji ?? FALLBACK;
}

export function getProfileEmoji(category, key, fallback = FALLBACK) {
  if (!category) return fallback;

  const group = MY_PROFILE_EMOJIS[category];
  if (!group) return fallback;

  const emoji = group[String(key).toLowerCase()];
  return emoji ?? fallback;
}

export function getTownHallEmoji(level) {
  return MY_EMOJIS.townHall[String(level)] ?? "🏰";
}