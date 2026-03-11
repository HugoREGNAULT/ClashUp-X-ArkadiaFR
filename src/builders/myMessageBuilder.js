// /src/builders/myMessageBuilder.js
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
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
        "*Analyse du JSON, parsing des données et synchronisation du profil joueur...*"
      )
    );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

export function buildMyImportSuccessV2({ parsed, profile, sourceLabel }) {
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
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `**Héros :** ${parsed.heroesCount ?? 0}`,
          `**Troupes :** ${parsed.troopsCount ?? 0}`,
          `**Sorts :** ${parsed.spellsCount ?? 0}`,
          `**Familiers :** ${parsed.petsCount ?? 0}`,
          `**Gardes :** ${parsed.guardsCount ?? 0}`,
          `**Équipements :** ${parsed.equipmentCount ?? 0}`,
          `**Engins :** ${parsed.siegeMachinesCount ?? 0}`,
          `**Remparts :** ${parsed.walls?.total ?? 0}`
        ].join("\n")
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `**Comptes liés :** ${linkedAccounts}`,
          `**Compte principal :** ${mainAccount}`
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
          "Aucune donnée importée n’a été trouvée.",
          "",
          "Utilise **/my import** puis réessaie **/my profile**."
        ].join("\n")
      )
    );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

export function buildMyPlayerNotFoundV2(tag) {
  const cleanTag = sanitizeTagToken(tag);

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## ❌ Joueur introuvable"),
      new TextDisplayBuilder().setContent(
        [
          `Aucun joueur n’a été trouvé pour le tag **#${cleanTag || "?"}**.`,
          "",
          "Vérifie bien le tag saisi.",
          "Ne confonds pas **O** et **0**."
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

export function buildMyProfileViewV2({
  parsed,
  apiPlayer,
  title,
  sections = [],
  apiUpdatedAt = null,
  uploadUpdatedAt = null
}) {
  const playerName = apiPlayer?.name || parsed?.playerName || "Inconnu";
  const playerTag = apiPlayer?.tag || parsed?.playerTag || "Inconnu";
  const playerUrl = apiPlayer?.tag
    ? `https://link.clashofclans.com/?action=OpenPlayerProfile&tag=${sanitizeTagToken(apiPlayer.tag)}`
    : null;

  const thEmoji = getEmoji("townHall", String(parsed?.townHall ?? apiPlayer?.townHallLevel ?? ""));
  const levelEmoji = getEmoji("misc", "level");
  const leagueEmoji = getEmoji("misc", "league");

  const clanName = apiPlayer?.clan?.name || "Sans clan";
  const clanTag = apiPlayer?.clan?.tag || null;
  const clanUrl = clanTag
    ? `https://link.clashofclans.com/?action=OpenClanProfile&tag=${sanitizeTagToken(clanTag)}`
    : null;
  const clanDisplay = clanUrl ? `[${clanName}](${clanUrl})` : clanName;

  const roleLabel = getRoleLabel(apiPlayer?.role);

  const leagueName =
    apiPlayer?.leagueTier?.name ||
    apiPlayer?.league?.name ||
    "Sans ligue";

  const leagueBadge =
    apiPlayer?.leagueTier?.iconUrls?.large ||
    apiPlayer?.leagueTier?.iconUrls?.small ||
    apiPlayer?.league?.iconUrls?.medium ||
    null;

  const headerText = [
      `  ⎬ Identifiant (TAG) : \`${playerTag}\``,
      ` ⎬ Niveau **${apiPlayer?.expLevel ?? "Inconnu"}**`,
      ` ⎬ HDV **${parsed?.townHall ?? apiPlayer?.townHallLevel ?? "Inconnu"}**`
  ].join("\n");

  const headerSection = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(headerText)
  );

  if (leagueBadge) {
    headerSection.setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(leagueBadge)
        .setDescription("Écusson de ligue")
    );
  }

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${playerName} (${clanDisplay} - ${roleLabel})`)
    )
    .addSectionComponents(headerSection);

  for (const section of sections.filter(Boolean)) {
    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setDivider(true)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(section)
    );
  }

  container
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          apiUpdatedAt ? `-# Dernière mise à jour API : <t:${toUnixTimestamp(apiUpdatedAt)}:R>` : null,
          uploadUpdatedAt
            ? `-# ${getEmoji("misc", "import")} Dernier upload : <t:${toUnixTimestamp(uploadUpdatedAt)}:R>`
            : `-# ${getEmoji("misc", "import")} Dernier upload : aucun`
        ]
          .filter(Boolean)
          .join("\n")
      )
    );

  const components = [container];

  const buttonRow = new ActionRowBuilder();

  if (playerUrl) {
    buttonRow.addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Voir le joueur en jeu")
        .setURL(playerUrl)
    );
  }

  if (clanUrl) {
    buttonRow.addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Rejoindre le clan")
        .setURL(clanUrl)
    );
  }

  if (buttonRow.components.length > 0) {
    components.push(buttonRow);
  }

  return {
    flags: MessageFlags.IsComponentsV2,
    components
  };
}

function getRoleLabel(role) {
  if (role === "leader") return "Chef";
  if (role === "coLeader") return "Adjoint";
  if (role === "admin") return "Aîné";
  if (role === "member") return "Membre";
  return "Sans rôle";
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