export function parseDurationToSeconds(input) {
    if (!input || typeof input !== "string") {
      throw new Error("Le temps fourni est invalide.");
    }
  
    const normalized = input
      .toLowerCase()
      .replace(/,/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  
    if (!normalized) {
      throw new Error("Le temps fourni est invalide.");
    }
  
    const regex =
      /(\d+)\s*(j|jour|jours|d|h|heure|heures|hr|hrs|m|min|mins|minute|minutes)/g;
  
    let totalSeconds = 0;
    let matchCount = 0;
    let match;
  
    while ((match = regex.exec(normalized)) !== null) {
      matchCount += 1;
  
      const value = Number(match[1]);
      const unit = match[2];
  
      if (!Number.isFinite(value) || value <= 0) continue;
  
      if (["j", "jour", "jours", "d"].includes(unit)) {
        totalSeconds += value * 24 * 60 * 60;
      } 
      else if (["h", "heure", "heures", "hr", "hrs"].includes(unit)) {
        totalSeconds += value * 60 * 60;
      } 
      else if (["m", "min", "mins", "minute", "minutes"].includes(unit)) {
        totalSeconds += value * 60;
      }
    }
  
    if (matchCount === 0 || totalSeconds <= 0) {
      throw new Error(
        "Format invalide. Exemples valides : `2j`, `1h 30min`, `2j 4h`, `45m`."
      );
    }
  
    return totalSeconds;
  }
  
  export function formatDurationFR(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
      return "0min";
    }
  
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
  
    const parts = [];
  
    if (days > 0) parts.push(`${days}j`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}min`);
  
    if (parts.length === 0) {
      parts.push("1min");
    }
  
    return parts.join(" ");
  }