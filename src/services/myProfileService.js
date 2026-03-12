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
  buildMySetMainSuccessV2
} from "../builders/myMessageBuilder.js";
import {
  buildProfileOverview,
  buildProfileCategory
} from "../builders/myProfileInteractiveBuilder.js";
import { logCommandError, logInfo } from "./logger.js";
import { computeVillageProgress } from "./myProgressService.js";
import { normalizeParsedVillage } from "./myIdResolverService.js";
import {
  getProfileEmoji,
  getTownHallEmoji
} from "../constants/myEmojis.js";

const LEVELS_PATH = path.join(process.cwd(), "data", "coc_levels.json");

let LEVELS_CACHE = null;
let DISPLAY_CACHE = null;

const VIEW_META = {
  heroes: { title: "Héros", icon: "🗡" },
  troops: { title: "Troupes", icon: "⚔️" },
  spells: { title: "Sorts", icon: "🧪" },
  sieges: { title: "Engins", icon: "🛠" },
  pets: { title: "Familiers", icon: "🔥" },
  guards: { title: "Gardiens", icon: "🛡" },
  walls: { title: "Remparts", icon: "🧱" },
  buildings: { title: "Bâtiments", icon: "🏠" }
};

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

    return interaction.reply(
      buildProfileOverview({
        parsed,
        apiPlayer: context.apiPlayer,
        progress,
        ownerId: interaction.user.id,
        tag: context.tag
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
  const parsedCustom = parseProfileCustomId(interaction.customId);

  if (!parsedCustom) {
    return false;
  }

  if (parsedCustom.userId !== interaction.user.id) {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: "❌ Ce panneau de profil ne t’appartient pas.",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "❌ Ce panneau de profil ne t’appartient pas.",
        ephemeral: true
      });
    }
    return true;
  }

  try {
    const context = await resolveProfileContext(
      interaction.user.id,
      `#${parsedCustom.tag}`,
      interaction.client.env.COC_API_TOKEN
    );

    if (!context || !context.apiPlayer) {
      await interaction.reply({
        content: "❌ Impossible de recharger ce profil.",
        ephemeral: true
      });
      return true;
    }

    const parsed = context.parsed
      ? normalizeParsedVillage(context.parsed)
      : buildApiOnlyParsed(context.apiPlayer);

    const progress = computeVillageProgress(parsed, parsed.townHall);

    if (parsedCustom.view === "overview") {
      await interaction.update(
        buildProfileOverview({
          parsed,
          apiPlayer: context.apiPlayer,
          progress,
          ownerId: interaction.user.id,
          tag: context.tag
        })
      );
      return true;
    }

    const detail = buildDetailViewData(parsedCustom.view, parsed, progress);

    if (!detail) {
      return false;
    }

    await interaction.update(
      buildProfileCategory({
        parsed,
        apiPlayer: context.apiPlayer,
        progressPercent: detail.percent,
        ownerId: interaction.user.id,
        tag: context.tag,
        title: detail.title,
        icon: detail.icon,
        lines: detail.lines,
        categoryKey: parsedCustom.view
      })
    );

    return true;
  } catch (error) {
    console.error("[MY PROFILE BUTTON] Erreur :", error);

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: "❌ Impossible de mettre à jour ce profil.",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "❌ Impossible de mettre à jour ce profil.",
        ephemeral: true
      });
    }

    return true;
  }
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

function buildDetailViewData(view, parsed, progress) {
  const townHall = Number(parsed?.townHall || 0);
  const meta = VIEW_META[view];

  if (!meta) return null;

  if (view === "heroes") {
    return {
      ...meta,
      percent: safePercent(progress.heroes),
      lines: formatDenseOverviewLines("heroes", parsed.heroes, townHall, 5)
    };
  }

  if (view === "troops") {
    return {
      ...meta,
      percent: safePercent(progress.troops),
      lines: formatDenseOverviewLines("troops", parsed.troops, townHall, 5)
    };
  }

  if (view === "spells") {
    return {
      ...meta,
      percent: safePercent(progress.spells),
      lines: formatDenseOverviewLines("spells", parsed.spells, townHall, 5)
    };
  }

  if (view === "sieges") {
    return {
      ...meta,
      percent: safePercent(progress.sieges),
      lines: formatDenseOverviewLines("sieges", parsed.siegeMachines, townHall, 5)
    };
  }

  if (view === "pets") {
    return {
      ...meta,
      percent: safePercent(progress.pets),
      lines: formatDenseOverviewLines("pets", parsed.pets, townHall, 5)
    };
  }

  if (view === "guards") {
    return {
      ...meta,
      percent: safePercent(progress.guards),
      lines: formatDenseOverviewLines("guards", parsed.guards, townHall, 5)
    };
  }

  if (view === "walls") {
    return {
      ...meta,
      percent: safePercent(progress.walls),
      lines: formatWallsDenseLines(parsed, progress)
    };
  }

  if (view === "buildings") {
    return {
      ...meta,
      percent: safePercent(progress.buildings),
      lines: formatBuildingsDenseLines(parsed, townHall)
    };
  }

  return null;
}

function parseProfileCustomId(customId) {
  const text = String(customId || "");
  if (!text.startsWith("profile_")) return null;

  const parts = text.split("_");
  if (parts.length < 4) return null;

  const view = parts[1];
  const userId = parts[2];
  const tag = parts.slice(3).join("_");

  if (!view || !userId || !tag) return null;

  return { view, userId, tag };
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

    items.push(`${emoji} \`${Number.isFinite(currentLevel) ? currentLevel : "0"}/${maxLevel}\``);
  }

  if (!items.length) {
    return ["↳ Aucune donnée disponible"];
  }

  return chunk(items, itemsPerLine).map((group, lineIndex) => {
    const prefix = lineIndex === 0 ? "↳ " : "  ";
    return `${prefix}${group.join("   ")}`;
  });
}

function formatWallsDenseLines(parsed, progress) {
  const byLevel = parsed?.walls?.byLevel ?? {};
  const maxLevel = Number(progress?.details?.walls?.maxLevel || 0);
  const items = [];

  const orderedLevels = Object.keys(byLevel)
    .map((key) => Number(key))
    .filter((level) => Number.isFinite(level))
    .sort((a, b) => b - a);

  for (const level of orderedLevels) {
    const count = Number(byLevel[level]);
    if (!Number.isFinite(count) || count <= 0) continue;

    items.push(`🧱 \`${count}× ${level}/${maxLevel || "?"}\``);
  }

  if (!items.length) {
    return ["↳ Aucune donnée disponible"];
  }

  return chunk(items, 5).map((group, lineIndex) => {
    const prefix = lineIndex === 0 ? "↳ " : "  ";
    return `${prefix}${group.join("   ")}`;
  });
}

function formatBuildingsDenseLines(parsed, townHall) {
  const index = getEntriesForCategory("buildings");
  const buildings = flattenBuildings(parsed?.buildings);
  const items = [];

  for (const entry of index.entries) {
    const maxLevel = getMaxFromEntry(entry, townHall);
    if (!Number.isFinite(maxLevel) || maxLevel <= 0) continue;

    const key = String(entry.api_name || "").toLowerCase();
    const currentLevel = Number(buildings?.[key]);

    items.push(`🏠 \`${Number.isFinite(currentLevel) ? currentLevel : "0"}/${maxLevel}\``);
  }

  if (!items.length) {
    return ["↳ Aucune donnée disponible"];
  }

  return chunk(items, 5).map((group, lineIndex) => {
    const prefix = lineIndex === 0 ? "↳ " : "  ";
    return `${prefix}${group.join("   ")}`;
  });
}

function flattenBuildings(buildings) {
  if (!buildings || typeof buildings !== "object") {
    return {};
  }

  if (Array.isArray(buildings)) {
    const mapped = {};
    for (const entry of buildings) {
      const key = String(entry?.api_name ?? entry?.name ?? entry?.key ?? "").toLowerCase();
      const level = Number(entry?.level);

      if (!key || !Number.isFinite(level)) continue;
      mapped[key] = level;
    }
    return mapped;
  }

  const output = {};

  for (const [key, value] of Object.entries(buildings)) {
    if (Number.isFinite(Number(value))) {
      output[String(key).toLowerCase()] = Number(value);
      continue;
    }

    if (value && typeof value === "object" && Number.isFinite(Number(value.level))) {
      output[String(key).toLowerCase()] = Number(value.level);
    }
  }

  return output;
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
  if (category === "buildings") return display.buildings;

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
      sieges: makeOrderedIndex(levels.siege_machines),
      buildings: makeOrderedIndex(
        levels.buildings ??
        levels.home_buildings ??
        levels.village_buildings ??
        []
      )
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

function chunk(array, size) {
  const output = [];
  for (let i = 0; i < array.length; i += size) {
    output.push(array.slice(i, i + size));
  }
  return output;
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
    buildings: {},
    walls: {
      total: 0,
      byLevel: {}
    },
    upgrades: [],
    lastSyncAt: null
  };
}