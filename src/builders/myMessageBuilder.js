import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder
} from "discord.js";
import { getEmoji } from "../constants/myEmojis.js";

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
          `**Héros :** ${parsed.heroesCount ?? 0}`,
          `**Troupes :** ${parsed.troopsCount ?? 0}`,
          `**Sorts :** ${parsed.spellsCount ?? 0}`,
          `**Familiers :** ${parsed.petsCount ?? 0}`,
          `**Équipements :** ${parsed.equipmentCount ?? 0}`,
          `**Engins :** ${parsed.siegeMachinesCount ?? 0}`,
          `**Remparts :** ${parsed.walls?.total ?? 0}`
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
        "Seul le propriétaire de cette fiche peut utiliser ce menu."
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
  apiPlayer,
  title,
  body
}) {
  const thEmoji = getEmoji("townHall", parsed.townHall);
  const levelEmoji = getEmoji("misc", "level");
  const clanEmoji = getEmoji("misc", "clan");
  const importEmoji = getEmoji("misc", "import");

  const leagueBadge =
    apiPlayer?.league?.iconUrls?.medium ||
    apiPlayer?.league?.iconUrls?.small ||
    null;

  const playerName = apiPlayer?.name || parsed.playerName || "Inconnu";
  const expLevel = apiPlayer?.expLevel ?? "Inconnu";

  const clanName = apiPlayer?.clan?.name || "Sans clan";
  const clanTag = apiPlayer?.clan?.tag || null;
  const clanUrl = clanTag
    ? `https://link.clashofclans.com/?action=OpenClanProfile&tag=${clanTag.replace("#", "")}`
    : null;
  const clanDisplay = clanUrl ? `[${clanName}](${clanUrl})` : clanName;

  const importTimestamp = toUnixTimestamp(parsed.lastSyncAt);

  const section = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## 👤 ${title}`),
    new TextDisplayBuilder().setContent(
      [
        `**Pseudo :** ${playerName}`,
        `**Tag :** ${parsed.playerTag}`,
        `${thEmoji} **HDV :** ${parsed.townHall ?? "Inconnu"}`,
        `${levelEmoji} **Niveau :** ${expLevel}`,
        `${clanEmoji} **Clan :** ${clanDisplay}`,
        importTimestamp
          ? `-# ${importEmoji} Dernier import : <t:${importTimestamp}:R>`
          : `-# ${importEmoji} Dernier import : inconnu`
      ].join("\n")
    )
  );

  if (leagueBadge) {
    section.setThumbnailAccessory(
      new ThumbnailBuilder().setURL(leagueBadge)
    );
  }

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addSectionComponents(section)
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

  const tagToken = sanitizeTagToken(parsed.playerTag);

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`my:profile-select:${ownerId}:${tagToken}`)
    .setPlaceholder("Naviguer dans le profil")
    .addOptions(
      buildOption("overview", "Aperçu", currentView === "overview"),
      buildOption("heroes", "Héros", currentView === "heroes"),
      buildOption("troops", "Troupes", currentView === "troops"),
      buildOption("spells", "Sorts", currentView === "spells"),
      buildOption("pets", "Familiers", currentView === "pets"),
      buildOption("sieges", "Engins", currentView === "sieges"),
      buildOption("equipment", "Équipements", currentView === "equipment"),
      buildOption("walls", "Remparts", currentView === "walls"),
      buildOption("upgrades", "Améliorations", currentView === "upgrades")
    );

  const row = new ActionRowBuilder().addComponents(menu);

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container, row]
  };
}

function buildOption(value, label, isDefault = false) {
  return {
    label,
    value,
    default: isDefault
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

function sanitizeTagToken(tag) {
  return String(tag || "")
    .replace(/^#/, "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();
}

function toUnixTimestamp(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return Math.floor(date.getTime() / 1000);
}