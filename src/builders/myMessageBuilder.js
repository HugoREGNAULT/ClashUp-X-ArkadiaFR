export function buildMyImportProgress(stepTitle, lines = []) {
  const details = lines.length > 0 ? lines.map((line) => `- ${line}`).join("\n") : "- Traitement en cours";

  return {
    content: [
      "## /my import",
      "",
      `**Étape :** ${stepTitle}`,
      "",
      details
    ].join("\n")
  };
}

export function buildMyImportSuccess(parsed, profile) {
  const mainAccountLabel =
    profile?.mainAccount && profile.mainAccount === parsed.playerTag
      ? "Oui"
      : profile?.mainAccount
        ? `Non (main actuelle : ${profile.mainAccount})`
        : "Oui";

  const unknownCounts = {
    heroes: parsed.unknownMappings?.heroes?.length ?? 0,
    pets: parsed.unknownMappings?.pets?.length ?? 0,
    equipment: parsed.unknownMappings?.equipment?.length ?? 0,
    buildings: parsed.unknownMappings?.buildings?.length ?? 0
  };

  return {
    content: [
      "## Import terminé",
      "",
      `**Compte :** ${parsed.playerTag}`,
      `**HDV :** ${parsed.townHall ?? "Inconnu"}`,
      `**Héros maison :** ${parsed.heroesCount}`,
      `**Héros BDC :** ${parsed.builderBaseHeroesCount}`,
      `**Pets :** ${parsed.petsCount}`,
      `**Équipements :** ${parsed.equipmentCount}`,
      `**Bâtiments parsés :** ${parsed.buildingsCount}`,
      "",
      "**Profil Discord :**",
      `- Comptes liés : ${Array.isArray(profile?.accounts) ? profile.accounts.length : 1}`,
      `- Compte principal : ${mainAccountLabel}`,
      "",
      "**Mappings inconnus détectés :**",
      `- Héros : ${unknownCounts.heroes}`,
      `- Pets : ${unknownCounts.pets}`,
      `- Équipements : ${unknownCounts.equipment}`,
      `- Bâtiments : ${unknownCounts.buildings}`,
      "",
      "Les fichiers `raw`, `parsed` et `profile.json` ont été mis à jour."
    ].join("\n")
  };
}

export function buildMyImportError(message) {
  return {
    content: [
      "## /my import",
      "",
      `❌ ${message}`
    ].join("\n")
  };
}