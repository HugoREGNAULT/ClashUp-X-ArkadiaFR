import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
    troops: parsed.unknownMappings?.troops?.length ?? 0,
    spells: parsed.unknownMappings?.spells?.length ?? 0,
    siegeMachines: parsed.unknownMappings?.siegeMachines?.length ?? 0,
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
          `**Pseudo**`,
          `${parsed.playerName || "Inconnu"}`,
          "",
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
          `**Héros :** ${parsed.heroesCount}`,
          `**Troupes :** ${parsed.troopsCount ?? 0}`,
          `**Sorts :** ${parsed.spellsCount ?? 0}`,
          `**Familiers :** ${parsed.petsCount}`,
          `**Équipements :** ${parsed.equipmentCount}`,
          `**Engins :** ${parsed.siegeMachinesCount ?? 0}`,
          `**Remparts :** ${parsed.walls?.total ?? 0}`,
          `**Bâtiments :** ${parsed.buildingsCount}`
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
          `Héros: ${unknownCounts.heroes} • Troupes: ${unknownCounts.troops} • Sorts: ${unknownCounts.spells}`,
          `Familiers: ${unknownCounts.pets} • Équipements: ${unknownCounts.equipment} • Engins: ${unknownCounts.siegeMachines} • Bâtiments: ${unknownCounts.buildings}`
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

export function buildMyNoProfileV2() {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## 📭 Aucun profil /my"),
      new TextDisplayBuilder().setContent(
        [
          "Aucune donnée importée n’a été trouvée pour ton compte Discord.",
          "",
          "Commence par utiliser **/my import** puis réessaie **/my profile**."
        ].join("\n")
      )
    );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

export function buildMySetMainSuccessV2({ tag, parsed }) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## ⭐ Compte principal mis à jour"),
      new TextDisplayBuilder().setContent(
        [
          `**Compte principal :** ${tag}`,
          `**Pseudo :** ${parsed?.playerName || "Inconnu"}`,
          `**HDV :** ${parsed?.townHall ?? "Inconnu"}`
        ].join("\n")
      )
    );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

export function buildMyUnauthorizedButtonV2() {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## 🔒 Action non autorisée"),
      new TextDisplayBuilder().setContent(
        "Seul le propriétaire de cette fiche peut utiliser ces boutons."
      )
    );

  return {
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [container]
  };
}

export function buildMyProfileViewV2({
  ownerId,
  currentView,
  profile,
  parsed,
  title,
  body
}) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 👤 ${title}`),
      new TextDisplayBuilder().setContent(
        [
          `**Pseudo :** ${parsed.playerName || "Inconnu"}`,
          `**Tag :** ${parsed.playerTag}`,
          `**HDV :** ${parsed.townHall ?? "Inconnu"}`,
          `**Main :** ${profile?.mainAccount || parsed.playerTag}`
        ].join("\n")
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  const tagToken = sanitizeTagToken(parsed.playerTag);

  const row1 = new ActionRowBuilder().addComponents(
    buildNavButton("overview", "Aperçu", currentView, ownerId, tagToken),
    buildNavButton("heroes", "Héros", currentView, ownerId, tagToken),
    buildNavButton("troops", "Troupes", currentView, ownerId, tagToken),
    buildNavButton("spells", "Sorts", currentView, ownerId, tagToken),
    buildNavButton("pets", "Familiers", currentView, ownerId, tagToken)
  );

  const row2 = new ActionRowBuilder().addComponents(
    buildNavButton("sieges", "Engins", currentView, ownerId, tagToken),
    buildNavButton("equipment", "Équipements", currentView, ownerId, tagToken),
    buildNavButton("walls", "Remparts", currentView, ownerId, tagToken),
    buildNavButton("upgrades", "Amélios", currentView, ownerId, tagToken),
    buildNavButton("buildings", "Bâtiments", currentView, ownerId, tagToken)
  );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container, row1, row2]
  };
}

function buildNavButton(view, label, currentView, ownerId, tagToken) {
  return new ButtonBuilder()
    .setCustomId(`my:view:${view}:${ownerId}:${tagToken}`)
    .setLabel(label)
    .setStyle(currentView === view ? ButtonStyle.Primary : ButtonStyle.Secondary);
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

function sanitizeTagToken(tag) {
  return String(tag || "")
    .replace(/^#/, "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();
}