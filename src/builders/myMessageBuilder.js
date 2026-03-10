import {
  ActionRowBuilder,
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
  "Seul le propriétaire peut utiliser ce menu."
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
  parsed,
  apiPlayer,
  title,
  body
  }) {
  const thEmoji = getEmoji("townHall", parsed.townHall);
  const levelEmoji = getEmoji("misc", "level");
  const clanEmoji = getEmoji("misc", "clan");
  const leagueEmoji = getEmoji("misc", "league");
  const importEmoji = getEmoji("misc", "import");
  
  const playerName = apiPlayer?.name || parsed.playerName || "Inconnu";
  const expLevel = apiPlayer?.expLevel ?? "Inconnu";
  
  const clanName = apiPlayer?.clan?.name || "Sans clan";
  const clanTag = apiPlayer?.clan?.tag || null;
  const clanUrl = clanTag
  ? `https://link.clashofclans.com/?action=OpenClanProfile&tag=${clanTag.replace("#", "")}`
  : null;
  const clanDisplay = clanUrl ? `[${clanName}](${clanUrl})` : clanName;
  
  // 🔥 correction ligue
  const leagueName =
  apiPlayer?.leagueTier?.name ||
  apiPlayer?.league?.name ||
  "Sans ligue";
  
  const leagueBadge =
  apiPlayer?.leagueTier?.iconUrls?.large ||
  apiPlayer?.leagueTier?.iconUrls?.small ||
  apiPlayer?.league?.iconUrls?.medium ||
  null;
  
  const importTimestamp = toUnixTimestamp(parsed.lastSyncAt);
  
  const headerText = [
  `**Pseudo :** ${playerName}`,
  `**Tag :** ${parsed.playerTag}`,
  `${thEmoji} **HDV :** ${parsed.townHall ?? "Inconnu"}`,
  `${levelEmoji} **Niveau :** ${expLevel}`,
  `${clanEmoji} **Clan :** ${clanDisplay}`,
  `${leagueEmoji} **Ligue :** ${leagueName}`
  ].join("\n");
  
  const headerSection = new SectionBuilder().addTextDisplayComponents(
  new TextDisplayBuilder().setContent(headerText)
  );
  
  if (leagueBadge) {
  headerSection.setThumbnailAccessory(
  new ThumbnailBuilder()
  .setURL(leagueBadge)
  .setDescription(`Écusson de ligue`)
  );
  }
  
  const container = new ContainerBuilder()
  .setAccentColor(ACCENT_COLOR)
  .addTextDisplayComponents(
  new TextDisplayBuilder().setContent(`## 👤 ${title}`)
  )
  .addSectionComponents(headerSection)
  .addSeparatorComponents(
  new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  )
  .addTextDisplayComponents(
  new TextDisplayBuilder().setContent(body)
  )
  .addSeparatorComponents(
  new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  )
  .addTextDisplayComponents(
  new TextDisplayBuilder().setContent(
  importTimestamp
  ? `-# ${importEmoji} Dernier import : <t:${importTimestamp}:R>`
  : `-# ${importEmoji} Dernier import : inconnu`
  )
  );
  
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
  return { label, value, default: isDefault };
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
  