/*
Central emoji registry for /my feature
Change emojis here only.
Fallback emoji = ❌
*/

const FALLBACK = "❌";

export const MY_EMOJIS = {

/* ---------------- PROFILE GENERAL ---------------- */

misc: {
profile: "👤",
level: "⭐",
clan: "🏰",
league: "🏆",
import: "📥",
upgrades: "⬆️"
},

/* ---------------- NAVIGATION MENU ---------------- */

menu: {
overview: "📊",
heroes: "👑",
troops: "⚔️",
spells: "🧪",
pets: "🐾",
sieges: "🚀",
equipment: "🛡️",
walls: "🧱",
upgrades: "⬆️"
},

/* ---------------- TOWN HALL ---------------- */

townHall: {
18: "🏰",
17: "🏯",
16: "🏛️",
15: "🏗️",
14: "🏗️",
13: "🏗️",
12: "🏗️",
11: "🏗️"
},

/* ---------------- HEROES ---------------- */

heroes: {
barbarianKing: "👑",
archerQueen: "🏹",
grandWarden: "🧙",
royalChampion: "🛡️",
minionPrince: "🦇",
dragonDuke: "🐉",


battleMachine: "🤖",
battleCopter: "🚁"


},

/* ---------------- PETS ---------------- */

pets: {
lassi: "🐶",
electroOwl: "🦉",
mightyYak: "🐂",
unicorn: "🦄",
phoenix: "🔥",
poisonLizard: "🦎",
diggy: "🐹",
frosty: "❄️"
},

/* ---------------- TROOPS ---------------- */

troops: {
barbarian: "🗡️",
archer: "🏹",
giant: "🗿",
goblin: "🪙",
wallBreaker: "💣",
balloon: "🎈",
wizard: "🧙",
healer: "💖",
dragon: "🐉",
pekka: "🤖",
babyDragon: "🐲",
miner: "⛏️",
electroDragon: "⚡",
yeti: "❄️",
dragonRider: "🐉",
rootRider: "🌿",
electroTitan: "⚡",
apprenticeWarden: "🧙"
},

/* ---------------- SPELLS ---------------- */

spells: {
lightning: "⚡",
heal: "💖",
rage: "🔥",
jump: "🦘",
freeze: "❄️",
clone: "🧬",
invisibility: "👻",
poison: "☠️",
earthquake: "🌍",
haste: "💨",
skeleton: "💀",
bat: "🦇"
},

/* ---------------- SIEGE MACHINES ---------------- */

siegeMachines: {
wallWrecker: "🚧",
battleBlimp: "🎈",
stoneSlammer: "🪨",
siegeBarracks: "🏹",
logLauncher: "🪵",
flameFlinger: "🔥",
battleDrill: "🛠️"
},

/* ---------------- EQUIPMENT ---------------- */

equipment: {
giantGauntlet: "🧤",
rageVial: "🧪",
vampstache: "🧛",
earthquakeBoots: "🥾",
spikyBall: "⚽",


invisibilityVial: "👻",
frozenArrow: "❄️",
archerPuppet: "🏹",
healerPuppet: "💖",
magicMirror: "🪞",

eternalTome: "📖",
healingTome: "📘",
rageGem: "💎",
lifeGem: "💚",
fireball: "🔥",

royalGem: "💎",
seekingShield: "🛡️",
hogRiderPuppet: "🐗",
hasteVial: "💨",
electroBoots: "⚡",
rocketShield: "🚀"


}

};

/* -------------------------------------------------- */
/* HELPER */
/* -------------------------------------------------- */

export function getEmoji(category, key) {

if (!category) return FALLBACK;

const group = MY_EMOJIS[category];

if (!group) return FALLBACK;

const emoji = group[key];

return emoji ?? FALLBACK;

}
