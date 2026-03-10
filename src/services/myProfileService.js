import fs from "fs";
import path from "path";
import { MessageFlags } from "discord.js";
import { fetchPlayerFromAPI } from "./cocPlayerService.js";
import { handleMyImport as handleImportFlow } from "./myImportService.js";
import {
  getMainParsedImport,
  getParsedImport,
  getPlayerProfile,
  setMainAccount
} from "./myStorageService.js";
import {
  buildMyNoProfileV2,
  buildMyProfileViewV2,
  buildMySetMainSuccessV2,
  buildMyUnauthorizedButtonV2
} from "../builders/myMessageBuilder.js";
import { logCommandError, logInfo } from "./logger.js";
import { computeVillageProgress } from "./myProgressService.js";
import { normalizeParsedVillage } from "./myIdResolverService.js";

const VIEW_KEYS = new Set([
  "overview",
  "heroes",
  "troops",
  "spells",
  "pets",
  "guards",
  "sieges",
  "equipment",
  "walls",
  "upgrades"
]);

const LEVELS_PATH = path.join(process.cwd(), "data", "coc_levels.json");

let LEVELS_CACHE = null;
let DISPLAY_CACHE = null;

export async function handleMyImport(interaction) {
  return handleImportFlow(interaction);
}

export async function handleMyProfile(interaction) {
  const requestedTag = interaction.options.getString("tag");

  try {
    const context = await resolveProfileContext(interaction.user.id, requestedTag);

    if (!context) {
      return interaction.reply(buildMyNoProfileV2());
    }

    const parsed = normalizeParsedVillage(context.parsed);

    const apiPlayer = await fetchPlayerFromAPI(
      parsed.playerTag,
      interaction.client.env.COC_API_TOKEN
    );

    const progress = computeVillageProgress(parsed, parsed.townHall);

    return interaction.reply(
      buildMyProfileViewV2({
        ownerId: interaction.user.id,
        currentView: "overview",
        profile: context.profile,
        parsed,
        apiPlayer,
        title: "Profil joueur",
        body: buildOverviewBody(parsed, progress)
      })
    );
  } catch (error) {
    console.error("[MY PROFILE] Erreur :", error);
    await logCommandError(interaction, error);

    return interaction.reply({
      content: "Impossible d’afficher ton profil Clash pour le moment.",
      flags: MessageFlags.Ephemeral
    });
  }
}

export async function handleMySetMain(interaction) {
  const tag = interaction.options.getString("tag", true);

  try {
    const updatedProfile = await setMainAccount(interaction.user.id, tag);
    const parsed = await getParsedImport(interaction.user.id, updatedProfile.mainAccount);

    await logInfo(
      interaction.client,
      "⭐ Compte principal mis à jour",
      [
        `**Utilisateur :** ${interaction.user.tag} (\`${interaction.user.id}\`)`,
        `**Nouveau main :** ${updatedProfile.mainAccount}`
      ].join("\n")
    );

    return interaction.reply(
      buildMySetMainSuccessV2({
        tag: updatedProfile.mainAccount,
        parsed: normalizeParsedVillage(parsed)
      })
    );
  } catch (error) {
    console.error("[MY SETMAIN] Erreur :", error);
    await logCommandError(interaction, error);

    return interaction.reply({
      content: `Impossible de définir ce compte principal : ${error.message}`,
      flags: MessageFlags.Ephemeral
    });
  }
}

export async function handleMyProfileButton(interaction) {
  if (!interaction.isStringSelectMenu()) {
    return false;
  }

  const parts = String(interaction.customId || "").split(":");

  if (parts.length !== 4 || parts[0] !== "my" || parts[1] !== "profile-select") {
    return false;
  }

  const ownerId = parts[2];
  const tagToken = parts[3];
  const view = interaction.values?.[0];

  if (!VIEW_KEYS.has(view)) {
    return false;
  }

  if (interaction.user.id !== ownerId) {
    await interaction.reply(buildMyUnauthorizedButtonV2());
    return true;
  }

  const tag = `#${tagToken}`;

  try {
    const profile = await getPlayerProfile(ownerId);
    const storedParsed = await getParsedImport(ownerId, tag);

    if (!profile || !storedParsed) {
      await interaction.reply(buildMyNoProfileV2());
      return true;
    }

    const parsed = normalizeParsedVillage(storedParsed);

    const apiPlayer = await fetchPlayerFromAPI(
      parsed.playerTag,
      interaction.client.env.COC_API_TOKEN
    );

    const progress = computeVillageProgress(parsed, parsed.townHall);

    await interaction.update(
      buildMyProfileViewV2({
        ownerId,
        currentView: view,
        profile,
        parsed,
        apiPlayer,
        title: getViewTitle(view),
        body: buildViewBody(view, parsed, progress)
      })
    );

    return true;
  } catch (error) {
    console.error("[MY PROFILE MENU] Erreur :", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Impossible de charger cette vue.",
        flags: MessageFlags.Ephemeral
      });
    }

    return true;
  }
}

async function resolveProfileContext(discordId, requestedTag) {
  const profile = await getPlayerProfile(discordId);

  if (!profile) return null;

  if (requestedTag) {
    const parsed = await getParsedImport(discordId, requestedTag);
    if (!parsed) return null;

    return { profile, parsed };
  }

  const parsed = await getMainParsedImport(discordId);
  if (!parsed) return null;

  return { profile, parsed };
}

function getViewTitle(view) {
  switch (view) {
    case "heroes":
      return "Héros";
    case "troops":
      return "Troupes";
    case "spells":
      return "Sorts";
    case "pets":
      return "Familiers";
    case "guards":
      return "Gardes";
    case "sieges":
      return "Engins de siège";
    case "equipment":
      return "Équipements";
    case "walls":
      return "Remparts";
    case "upgrades":
      return "Améliorations";
    default:
      return "Profil joueur";
  }
}

function buildViewBody(view, parsed, progress) {
  switch (view) {
    case "overview":
      return buildOverviewBody(parsed, progress);
    case "heroes":
      return buildHeroesBody(parsed);
    case "troops":
      return buildLeveledBody("Troupes", parsed.troops, "troops", parsed.townHall);
    case "spells":
      return buildLeveledBody("Sorts", parsed.spells, "spells", parsed.townHall);
    case "pets":
      return buildLeveledBody("Familiers", parsed.pets, "pets", parsed.townHall);
    case "guards":
      return buildLeveledBody("Gardes", parsed.guards, "guards", parsed.townHall);
    case "sieges":
      return buildLeveledBody("Engins de siège", parsed.siegeMachines, "sieges", parsed.townHall);
    case "equipment":
      return buildLeveledBody("Équipements", parsed.equipment, "equipment", parsed.townHall);
    case "walls":
      return buildWallsBody(parsed);
    case "upgrades":
      return buildUpgradesBody(parsed, progress);
    default:
      return buildOverviewBody(parsed, progress);
  }
}

function buildOverviewBody(parsed, progress) {
  const wallsTotal = parsed.walls?.total ?? sumObjectValues(parsed.walls?.byLevel);

  return [
    "**Progression du village**",
    "",
    `👑 **Héros :** ${progress.heroes}%`,
    `⚔️ **Troupes :** ${progress.troops}%`,
    `🧪 **Sorts :** ${progress.spells}%`,
    `🐾 **Familiers :** ${progress.pets}%`,
    `🛡️ **Gardes :** ${progress.guards}%`,
    `🚀 **Engins :** ${progress.sieges}%`,
    "",
    `🏰 **Village global :** ${progress.overall}%`,
    `🧱 **Remparts détectés :** ${wallsTotal}`,
    "",
    "_Utilise le menu ci-dessous pour ouvrir le détail de chaque catégorie._"
  ].join("\n");
}

function buildHeroesBody(parsed) {
  const homeHeroes = formatLeveledEntries(parsed.heroes, "heroes", parsed.townHall);
  const builderHeroes = formatLeveledEntries(parsed.builderHeroes, "builderHeroes", parsed.townHall);

  if (!homeHeroes.length && !builderHeroes.length) {
    return "Aucun héros trouvé dans le dernier import.";
  }

  return [
    "**Village principal**",
    homeHeroes.length ? homeHeroes.join("\n") : "_Aucune donnée_",
    "",
    "**Base des ouvriers**",
    builderHeroes.length ? builderHeroes.join("\n") : "_Aucune donnée_"
  ].join("\n");
}

function buildLeveledBody(label, collection, category, townHall) {
  const lines = formatLeveledEntries(collection, category, townHall);

  if (!lines.length) {
    return `Aucune donnée pour ${label.toLowerCase()}.`;
  }

  return lines.join("\n");
}

function buildWallsBody(parsed) {
  const walls = parsed.walls || { total: 0, byLevel: {} };
  const byLevel = walls.byLevel || {};

  const entries = Object.entries(byLevel)
    .map(([level, count]) => [Number(level), Number(count)])
    .filter(([level, count]) => count > 0)
    .sort((a, b) => b[0] - a[0]);

  if (!entries.length) {
    return "Aucune donnée de remparts trouvée.";
  }

  return [
    `**Total :** ${walls.total ?? sumObjectValues(byLevel)}`,
    "",
    ...entries.map(([level, count]) => `🧱 Niveau ${level} • ${count}`)
  ].join("\n");
}

function buildUpgradesBody(parsed, progress) {
  const lines = formatUpgradeEntries(parsed);

  if (!lines.length) {
    return [
      "**Progression par catégorie**",
      "",
      `👑 Héros : ${progress.heroes}%`,
      `⚔️ Troupes : ${progress.troops}%`,
      `🧪 Sorts : ${progress.spells}%`,
      `🐾 Familiers : ${progress.pets}%`,
      `🛡️ Gardes : ${progress.guards}%`,
      `🚀 Engins : ${progress.sieges}%`,
      "",
      `🏰 Village global : ${progress.overall}%`,
      "",
      "_Aucune amélioration en cours détectée._"
    ].join("\n");
  }

  return [
    "**Améliorations en cours**",
    "",
    ...lines
  ].join("\n");
}

function formatLeveledEntries(collection, category, townHall) {
  if (!collection || typeof collection !== "object") return [];

  return Object.entries(collection)
    .map(([key, level]) => {
      const numericLevel = Number(level);
      const display = getDisplayData(category, key, townHall);
      const maxLevel = getMaxForCategory(category, key, townHall);

      return {
        level: numericLevel,
        order: display.order,
        text: `${display.prefix} ${formatLevelProgress(numericLevel, maxLevel)}`
      };
    })
    .filter((entry) => Number.isFinite(entry.level))
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.text);
}

function formatUpgradeEntries(parsed) {
  const upgrades = Array.isArray(parsed?.upgrades) ? parsed.upgrades : [];

  return upgrades
    .map((upgrade) => {
      const display = getDisplayData(upgrade.category, upgrade.key, parsed.townHall);
      const currentLevel = Number(upgrade.level);
      const maxLevel = getMaxForCategory(upgrade.category, upgrade.key, parsed.townHall);
      const progressText = Number.isFinite(currentLevel)
        ? formatLevelProgress(currentLevel, maxLevel)
        : "";

      const parts = [display.prefix];

      if (progressText) {
        parts.push(progressText);
      }

      if (upgrade.timer > 0) {
        parts.push(`⏳ ${formatDuration(upgrade.timer)}`);
      }

      if (upgrade.helperTimer > 0) {
        parts.push(`🧑‍🔧 ${formatDuration(upgrade.helperTimer)}`);
      }

      if (upgrade.helperCooldown > 0) {
        parts.push(`🔁 ${formatDuration(upgrade.helperCooldown)}`);
      }

      return {
        order: display.order,
        timer: Number(upgrade.timer || 0),
        line: parts.join(" ")
      };
    })
    .sort((a, b) => {
      if (a.timer > 0 && b.timer > 0) return a.timer - b.timer;
      if (a.timer > 0) return -1;
      if (b.timer > 0) return 1;
      return a.order - b.order;
    })
    .map((entry) => entry.line);
}

function getDisplayData(category, key, townHall) {
  const display = getDisplayIndexes();
  const normalizedKey = String(key).toLowerCase();

  if (category === "heroes") {
    const meta = display.heroes.meta.get(normalizedKey);
    if (meta) return makeDisplayLine(meta, display.heroes.order.get(normalizedKey));
  }

  if (category === "troops") {
    const meta = display.troops.meta.get(normalizedKey);
    if (meta) return makeDisplayLine(meta, display.troops.order.get(normalizedKey));
  }

  if (category === "spells") {
    const meta = display.spells.meta.get(normalizedKey);
    if (meta) return makeDisplayLine(meta, display.spells.order.get(normalizedKey));
  }

  if (category === "pets") {
    const meta = display.pets.meta.get(normalizedKey);
    if (meta) return makeDisplayLine(meta, display.pets.order.get(normalizedKey));
  }

  if (category === "guards") {
    const meta = display.guards.meta.get(normalizedKey);
    if (meta) return makeDisplayLine(meta, display.guards.order.get(normalizedKey));
  }

  if (category === "sieges") {
    const meta = display.sieges.meta.get(normalizedKey);
    if (meta) return makeDisplayLine(meta, display.sieges.order.get(normalizedKey));
  }

  if (category === "builderHeroes") {
    if (normalizedKey === "battlemachine") {
      return {
        order: 0,
        prefix: "⚙️ ・ Machine de combat"
      };
    }

    if (normalizedKey === "battlecopter") {
      return {
        order: 1,
        prefix: "🚁 ・ Hélicoptère de combat"
      };
    }
  }

  return {
    order: 999999,
    prefix: `❓ ・ ${humanizeKey(key)}`
  };
}

function makeDisplayLine(entry, order) {
  const emoji = String(entry?.emoji_markdown ?? "").trim() || "❓";
  const label = String(entry?.name_fr || entry?.name_en || entry?.api_label || entry?.api_name || "Inconnu").trim();

  return {
    order: Number.isFinite(Number(order)) ? Number(order) : 999999,
    prefix: `${emoji} ・ ${label}`
  };
}

function formatLevelProgress(currentLevel, maxLevel) {
  if (!Number.isFinite(Number(currentLevel))) {
    return "";
  }

  if (!Number.isFinite(Number(maxLevel)) || Number(maxLevel) <= 0) {
    return `\`${currentLevel}/?\``;
  }

  return `\`${currentLevel}/${maxLevel}\``;
}

function getMaxForCategory(category, key, townHall) {
  const indexes = getDisplayIndexes();
  const normalizedKey = String(key).toLowerCase();
  const th = Number(townHall);

  if (!Number.isFinite(th)) {
    return null;
  }

  let entry = null;

  if (category === "heroes") entry = indexes.heroes.meta.get(normalizedKey);
  else if (category === "troops") entry = indexes.troops.meta.get(normalizedKey);
  else if (category === "spells") entry = indexes.spells.meta.get(normalizedKey);
  else if (category === "pets") entry = indexes.pets.meta.get(normalizedKey);
  else if (category === "guards") entry = indexes.guards.meta.get(normalizedKey);
  else if (category === "sieges") entry = indexes.sieges.meta.get(normalizedKey);

  if (!entry?.max_by_hdv) {
    return null;
  }

  const value = entry.max_by_hdv[String(th)];
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function getDisplayIndexes() {
  if (!DISPLAY_CACHE) {
    const levels = loadLevels();

    DISPLAY_CACHE = {
      heroes: makeOrderedIndex(levels.heroes),
      troops: makeOrderedIndex(levels.troops),
      spells: makeOrderedIndex(levels.spells),
      pets: makeOrderedIndex(levels.pets),
      guards: makeOrderedIndex(levels.guards),
      sieges: makeOrderedIndex(levels.siege_machines)
    };
  }

  return DISPLAY_CACHE;
}

function makeOrderedIndex(entries) {
  const meta = new Map();
  const order = new Map();

  for (const [index, entry] of (entries ?? []).entries()) {
    if (!entry?.api_name) continue;

    const key = String(entry.api_name).toLowerCase();
    meta.set(key, entry);
    order.set(key, index);
  }

  return { meta, order };
}

function loadLevels() {
  if (!LEVELS_CACHE) {
    LEVELS_CACHE = JSON.parse(fs.readFileSync(LEVELS_PATH, "utf8"));
  }

  return LEVELS_CACHE;
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];

  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  if (!parts.length) {
    return `${seconds}s`;
  }

  return parts.slice(0, 2).join(" ");
}

function sumObjectValues(collection) {
  if (!collection) return 0;
  return Object.values(collection).reduce((t, v) => t + Number(v || 0), 0);
}

function humanizeKey(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}