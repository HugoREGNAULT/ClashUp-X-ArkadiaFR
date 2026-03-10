import {
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder
} from "discord.js";

const ACCENT_COLOR = 0xA8DCFF;

export function buildMyImportProgressV2({ title, description, percent, sourceLabel }) {
  const safePercent = clampPercent(percent);
  const progressBar = makeProgressBar(safePercent);

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## 📥 Import du village"),
      new TextDisplayBuilder().setContent(
        [
          `**Étape actuelle**`,
          `${title}`,
          "",
          `**Détail**`,
          `${description}`,
          "",
          `**Source**`,
          `${sourceLabel || "Préparation..."}`,
          "",
          `**Progression**`,
          `${progressBar} **${safePercent}%**`
        ].join("\n")
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "_Analyse du JSON, parsing des données et synchronisation du profil joueur..._"
      )
    );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

export function buildMyImportSuccessV2({ parsed, profile, sourceLabel }) {
  const unknownCounts = {
    heroes: parsed.unknownMappings?.heroes?.length ?? 0,
    pets: parsed.unknownMappings?.pets?.length ?? 0,
    equipment: parsed.unknownMappings?.equipment?.length ?? 0,
    buildings: parsed.unknownMappings?.buildings?.length ?? 0
  };

  const linkedAccounts = Array.isArray(profile?.accounts) ? profile.accounts.length : 1;
  const mainAccount = profile?.mainAccount || parsed.playerTag;

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## ✅ Import terminé"),
      new TextDisplayBuilder().setContent(
        [
          `**Compte**`,
          `${parsed.playerTag}`,
          "",
          `**HDV**`,
          `${parsed.townHall ?? "Inconnu"}`,
          "",
          `**Source**`,
          `${sourceLabel || "Import direct"}`
        ].join("\n")
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `**Héros maison :** ${parsed.heroesCount}`,
          `**Héros BDC :** ${parsed.builderBaseHeroesCount}`,
          `**Pets :** ${parsed.petsCount}`,
          `**Équipements :** ${parsed.equipmentCount}`,
          `**Bâtiments parsés :** ${parsed.buildingsCount}`
        ].join("\n")
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `**Comptes liés :** ${linkedAccounts}`,
          `**Compte principal :** ${mainAccount}`,
          "",
          `**Mappings inconnus**`,
          `Héros: ${unknownCounts.heroes} • Pets: ${unknownCounts.pets} • Équipements: ${unknownCounts.equipment} • Bâtiments: ${unknownCounts.buildings}`
        ].join("\n")
      )
    );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

export function buildMyImportErrorV2(message) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## ❌ Import impossible"),
      new TextDisplayBuilder().setContent(String(message || "Erreur inconnue."))
    );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

function makeProgressBar(percent) {
  const total = 12;
  const filled = Math.round((percent / 100) * total);
  const empty = total - filled;

  return `\`${"█".repeat(filled)}${"░".repeat(empty)}\``;
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}