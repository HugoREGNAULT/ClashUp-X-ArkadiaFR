// /src/services/myProfileService.js
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
  buildMyPlayerNotFoundV2,
  buildMyProfileViewV2,
  buildMySetMainSuccessV2
} from "../builders/myMessageBuilder.js";
import { logCommandError, logInfo } from "./logger.js";
import { computeVillageProgress } from "./myProgressService.js";
import { normalizeParsedVillage } from "./myIdResolverService.js";
import { getProfileEmoji, getTownHallEmoji } from "../constants/myEmojis.js";

const LEVELS_PATH = path.join(process.cwd(), "data", "coc_levels.json");

let LEVELS_CACHE = null;
let DISPLAY_CACHE = null;

export async function handleMyImport(interaction) {
  return handleImportFlow(interaction);
}

export async function handleMyProfile(interaction) {
  const requestedTag = interaction.options.getString("tag");

  try {
    const context = await resolveProfileContext(
      interaction.user.id,
      requestedTag,
      interaction.client.env.COC_API_TOKEN
    );

    if (!context) {
      return interaction.reply(buildMyNoProfileV2());
    }

    if (!context.apiPlayer) {
      return interaction.reply(buildMyPlayerNotFoundV2(context.tag));
    }

    const parsed = context.parsed
      ? normalizeParsedVillage(context.parsed)
      : buildApiOnlyParsed(context.apiPlayer);

    const progress = computeVillageProgress(parsed, parsed.townHall);
    const sections = buildProfileSections({
      parsed,
      progress,
      hasUpload: Boolean(context.parsed)
    });

    return interaction.reply(
      buildMyProfileViewV2({
        parsed,
        apiPlayer: context.apiPlayer,
        title: "Profil joueur",
        sections,
        apiUpdatedAt: context.apiUpdatedAt,
        uploadUpdatedAt: parsed.lastSyncAt || null
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

export async function handleMyProfileButton() {
  return false;
}

async function resolveProfileContext(discordId, requestedTag, apiToken) {
  const normalizedRequestedTag = sanitizeTag(requestedTag);

  if (normalizedRequestedTag) {
    const parsed = await getParsedImport(discordId, normalizedRequestedTag);
    const apiPlayer = await fetchPlayerFromAPI(normalizedRequestedTag, apiToken);

    return {
      profile: await getPlayerProfile(discordId),
      parsed,
      apiPlayer,
      tag: normalizedRequestedTag,
      apiUpdatedAt: new Date()
    };
  }

  const profile = await getPlayerProfile(discordId);
  if (!profile) return null;

  const parsed = await getMainParsedImport(discordId);
  if (!parsed) return null;

  const normalizedParsed = normalizeParsedVillage(parsed);
  const apiPlayer = await fetchPlayerFromAPI(normalizedParsed.playerTag, apiToken);

  return {
    profile,
    parsed: normalizedParsed,
    apiPlayer,
    tag: normalizedParsed.playerTag,
    apiUpdatedAt: new Date()
  };
}

function buildProfileSections({ parsed, progress, hasUpload }) {
  const sections = [];
  const townHall = Number(parsed?.townHall || 0);

  if (!hasUpload) {
    sections.push(
      [
        "📡 **Données API uniquement**",
        "",
        "Aucun upload JSON n’a été trouvé pour ce compte.",
        "Utilise **/my import** pour afficher la progression détaillée du village."
      ].join("\n")
    );

    sections.push(
      [
        "📊 **Aperçu**",
        "",
        "Aucune progression détaillée disponible sans upload."
      ].join("\n")
    );

    return sections;
  }

  sections.push(buildHeroesSection(parsed, progress, townHall));
  sections.push(buildCategorySection({
    icon: "<:4_:1481034391772991559>",
    title: "Troupes",
    percent: progress.troops,
    category: "troops",
    collection: parsed.troops,
    townHall,
    itemsPerLine: 5
  }));
  sections.push(buildCategorySection({
    icon: "<:3_:1481032721626300579>",
    title: "Sorts",
    percent: progress.spells,
    category: "spells",
    collection: parsed.spells,
    townHall,
    itemsPerLine: 5
  }));
  sections.push(buildCategorySection({
    icon: "<:2_:1481028283427459082>",
    title: "Engins de siège",
    percent: progress.sieges,
    category: "sieges",
    collection: parsed.siegeMachines,
    townHall,
    itemsPerLine: 4
  }));

  if (hasUnlockedEntries("pets", townHall)) {
    sections.push(buildCategorySection({
      icon: "<:2_:1481028283427459082>",
      title: "Familiers",
      percent: progress.pets,
      category: "pets",
      collection: parsed.pets,
      townHall,
      itemsPerLine: 5
    }));
  }

  if (hasUnlockedEntries("guards", townHall)) {
    sections.push(buildCategorySection({
      icon: "<:2_:1481028283427459082>",
      title: "Gardiens",
      percent: progress.guards,
      category: "guards",
      collection: parsed.guards,
      townHall,
      itemsPerLine: 4
    }));
  }

  sections.push(buildWallsSection(parsed));

  return sections.filter(Boolean);
}

function buildHeroesSection(parsed, progress, townHall) {
  const homeLines = formatDenseOverviewLines("heroes", parsed.heroes, townHall, 6);
  const builderLines = formatBuilderHeroesDenseLines(parsed.builderHeroes);

  return [
    `<:1_:1481026443470176409>〡Héros **${safePercent(progress.heroes)}%**`,
    homeLines.length ? homeLines.join("\n") : "     ➥ Aucune donnée",
    builderLines.length ? "" : null,
    builderLines.length ? "<:1_:1481026443470176409> __Base des ouvriers__ :" : null,
    ...builderLines
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCategorySection({ icon, title, percent, category, collection, townHall, itemsPerLine }) {
  const lines = formatDenseOverviewLines(category, collection, townHall, itemsPerLine);

  return [
    `${icon}〡${title} **${safePercent(percent)}%**`,
    lines.length ? lines.join("\n") : "     ➥ Aucune donnée"
  ].join("\n");
}

function buildWallsSection(parsed) {
  const total = parsed?.walls?.total ?? sumObjectValues(parsed?.walls?.byLevel);

  return [
    "🧱〡Remparts",
    `     ➥ ${total || 0} détectés`
  ].join("\n");
}

function formatDenseOverviewLines(category, collection, townHall, itemsPerLine) {
  const index = getEntriesForCategory(category);
  const items = [];

  for (const entry of index.entries) {
    const maxLevel = getMaxFromEntry(entry, townHall);
    if (!Number.isFinite(maxLevel) || maxLevel <= 0) continue;

    const key = String(entry.api_name || "").toLowerCase();
    const currentLevel = Number(collection?.[key]);
    const emoji = getResolvedEmoji(category, key, entry?.emoji_markdown);

    items.push(`${emoji} \`${Number.isFinite(currentLevel) ? currentLevel : "?"}/${maxLevel}\``);
  }

  return chunk(items, itemsPerLine).map((group, lineIndex) => {
    const prefix = lineIndex === 0 ? "     ➥ " : "           ";
    return `${prefix}${group.join("  ")}`;
  });
}

function formatBuilderHeroesDenseLines(collection) {
  if (!collection || typeof collection !== "object") return [];

  const entries = [];
  const machine = Number(collection.battlemachine);
  const copter = Number(collection.battlecopter);

  if (Number.isFinite(machine)) {
    entries.push(`${getProfileEmoji("builderHeroes", "battlemachine")} \`${machine}/?\``);
  }

  if (Number.isFinite(copter)) {
    entries.push(`${getProfileEmoji("builderHeroes", "battlecopter")} \`${copter}/?\``);
  }

  return chunk(entries, 4).map((group, index) => {
    const prefix = index === 0 ? "     ➥ " : "           ";
    return `${prefix}${group.join("  ")}`;
  });
}

function getResolvedEmoji(category, key, fallbackEmojiMarkdown) {
  const fallback = isValidEmojiMarkdown(fallbackEmojiMarkdown) ? fallbackEmojiMarkdown : "❓";
  return getProfileEmoji(category, key, fallback);
}

function isValidEmojiMarkdown(value) {
  const text = String(value || "").trim();
  return /^<a?:[A-Za-z0-9_~\-]+:\d+>$/.test(text);
}

function getEntriesForCategory(category) {
  const display = getDisplayIndexes();

  if (category === "heroes") return display.heroes;
  if (category === "troops") return display.troops;
  if (category === "spells") return display.spells;
  if (category === "pets") return display.pets;
  if (category === "guards") return display.guards;
  if (category === "sieges") return display.sieges;

  return { entries: [], meta: new Map(), order: new Map() };
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
  const list = [];

  for (const [index, entry] of (entries ?? []).entries()) {
    if (!entry?.api_name) continue;

    const key = String(entry.api_name).toLowerCase();
    meta.set(key, entry);
    order.set(key, index);
    list.push(entry);
  }

  return { meta, order, entries: list };
}

function loadLevels() {
  if (!LEVELS_CACHE) {
    LEVELS_CACHE = JSON.parse(fs.readFileSync(LEVELS_PATH, "utf8"));
  }

  return LEVELS_CACHE;
}

function getMaxFromEntry(entry, townHall) {
  if (!entry?.max_by_hdv) {
    return null;
  }

  const exact = entry.max_by_hdv[String(townHall)];
  if (Number.isFinite(Number(exact))) {
    return Number(exact);
  }

  let best = null;

  for (const [hdvKey, maxValue] of Object.entries(entry.max_by_hdv)) {
    const hdv = Number(hdvKey);
    const max = Number(maxValue);

    if (!Number.isFinite(hdv) || !Number.isFinite(max)) continue;
    if (hdv > townHall) continue;

    if (best === null || hdv > best.hdv) {
      best = { hdv, max };
    }
  }

  return best?.max ?? null;
}

function hasUnlockedEntries(category, townHall) {
  const index = getEntriesForCategory(category);
  return index.entries.some((entry) => {
    const max = getMaxFromEntry(entry, townHall);
    return Number.isFinite(max) && max > 0;
  });
}

function chunk(array, size) {
  const output = [];
  for (let i = 0; i < array.length; i += size) {
    output.push(array.slice(i, i + size));
  }
  return output;
}

function sumObjectValues(collection) {
  if (!collection) return 0;
  return Object.values(collection).reduce((total, value) => total + Number(value || 0), 0);
}

function safePercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function sanitizeTag(tag) {
  const clean = String(tag || "")
    .trim()
    .replace(/^#/, "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();

  return clean ? `#${clean}` : null;
}

function buildApiOnlyParsed(apiPlayer) {
  const townHall = Number(apiPlayer?.townHallLevel || 0);

  return {
    playerTag: apiPlayer?.tag || null,
    playerName: apiPlayer?.name || "Inconnu",
    townHall,
    townHallEmoji: getTownHallEmoji(townHall),
    heroes: {},
    builderHeroes: {},
    troops: {},
    spells: {},
    pets: {},
    guards: {},
    equipment: {},
    siegeMachines: {},
    walls: {
      total: 0,
      byLevel: {}
    },
    upgrades: [],
    lastSyncAt: null
  };
}