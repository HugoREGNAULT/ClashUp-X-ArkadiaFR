const TH_EMOJIS = {
    18: "<:HDV_18:1449923786253013133>",
    17: "<:HDV_17:1449924430997487656>",
    16: "<:HDV_16:1449924611130134639>",
    15: "<:HDV_15:1449924718894383318>",
    14: "<:HDV_14:1449924830861463743>",
    13: "<:HDV_13:1449924948695974040>",
    12: "<:HDV_12:1449925050965692438>",
    11: "<:HDV_11:1449925143798485157>",
    "10-": "<:HDV_10:1449925329412952194>"
  };
  
  export function getTownHallEmoji(level) {
    const th = Number(level ?? 0);
  
    if (th >= 18) return TH_EMOJIS[18];
    if (th === 17) return TH_EMOJIS[17];
    if (th === 16) return TH_EMOJIS[16];
    if (th === 15) return TH_EMOJIS[15];
    if (th === 14) return TH_EMOJIS[14];
    if (th === 13) return TH_EMOJIS[13];
    if (th === 12) return TH_EMOJIS[12];
    if (th === 11) return TH_EMOJIS[11];
  
    return TH_EMOJIS["10-"];
  }