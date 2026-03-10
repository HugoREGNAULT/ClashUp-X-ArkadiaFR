const FALLBACK_EMOJI = "❌";

export const MY_EMOJIS = {
  townHall: {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null,
    10: null,
    11: null,
    12: null,
    13: null,
    14: null,
    15: null,
    16: null,
    17: null,
    18: null
  },

  heroes: {
    barbarianKing: null,
    archerQueen: null,
    grandWarden: null,
    royalChampion: null,
    minionPrince: null,
    dragonDuke: null,
    battleMachine: null,
    battleCopter: null
  },

  misc: {
    level: null,
    clan: null,
    league: null,
    import: null
  }
};

export function getEmoji(category, key) {
  const value = MY_EMOJIS?.[category]?.[key];
  return value || FALLBACK_EMOJI;
}