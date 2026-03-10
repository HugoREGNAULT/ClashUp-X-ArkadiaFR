const WAR_LEAGUE_TRANSLATIONS = {
    Unranked: "Non classé",
  
    "Bronze League III": "Ligue Bronze III",
    "Bronze League II": "Ligue Bronze II",
    "Bronze League I": "Ligue Bronze I",
  
    "Silver League III": "Ligue Argent III",
    "Silver League II": "Ligue Argent II",
    "Silver League I": "Ligue Argent I",
  
    "Gold League III": "Ligue Or III",
    "Gold League II": "Ligue Or II",
    "Gold League I": "Ligue Or I",
  
    "Crystal League III": "Ligue Cristal III",
    "Crystal League II": "Ligue Cristal II",
    "Crystal League I": "Ligue Cristal I",
  
    "Master League III": "Ligue Maître III",
    "Master League II": "Ligue Maître II",
    "Master League I": "Ligue Maître I",
  
    "Champion League III": "Ligue Champion III",
    "Champion League II": "Ligue Champion II",
    "Champion League I": "Ligue Champion I"
  };
  
  export function translateWarLeagueName(apiName) {
    if (!apiName) return "Non classé";
    return WAR_LEAGUE_TRANSLATIONS[apiName] || apiName;
  }
  
  export default WAR_LEAGUE_TRANSLATIONS;