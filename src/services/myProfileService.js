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

const VIEW_KEYS = new Set([
  "overview",
  "heroes",
  "troops",
  "spells",
  "pets",
  "sieges",
  "equipment",
  "walls",
  "upgrades"
]);

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

    const apiPlayer = await fetchPlayerFromAPI(
      context.parsed.playerTag,
      interaction.client.env.COC_API_TOKEN
    );

    const progress = computeVillageProgress(context.parsed, context.parsed.townHall);

    return interaction.reply(
      buildMyProfileViewV2({
        ownerId: interaction.user.id,
        currentView: "overview",
        profile: context.profile,
        parsed: context.parsed,
        apiPlayer,
        title: "Profil joueur",
        body: buildOverviewBody(context.parsed, progress)
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
        parsed
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
    const parsed = await getParsedImport(ownerId, tag);

    if (!profile || !parsed) {
      await interaction.reply(buildMyNoProfileV2());
      return true;
    }

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
      return buildLeveledBody("Troupes", parsed.troops);
    case "spells":
      return buildLeveledBody("Sorts", parsed.spells);
    case "pets":
      return buildLeveledBody("Familiers", parsed.pets);
    case "sieges":
      return buildLeveledBody("Engins de siège", parsed.siegeMachines);
    case "equipment":
      return buildLeveledBody("Équipements", parsed.equipment);
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
    `🚀 **Engins :** ${progress.sieges}%`,
    "",
    `🧱 **Remparts détectés :** ${wallsTotal}`,
    "",
    "_Utilise le menu ci-dessous pour ouvrir le détail de chaque catégorie._"
  ].join("\n");
}

function buildHeroesBody(parsed) {
  const homeHeroes = formatLeveledEntries(parsed.heroes);
  const builderHeroes = formatLeveledEntries(parsed.builderHeroes);

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

function buildLeveledBody(label, collection) {
  const lines = formatLeveledEntries(collection);

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
    ...entries.map(([level, count]) => `Niveau ${level} • ${count}`)
  ].join("\n");
}

function buildUpgradesBody(parsed, progress) {
  return [
    "**Progression par catégorie**",
    "",
    `👑 Héros : ${progress.heroes}%`,
    `⚔️ Troupes : ${progress.troops}%`,
    `🧪 Sorts : ${progress.spells}%`,
    `🐾 Familiers : ${progress.pets}%`,
    `🚀 Engins : ${progress.sieges}%`
  ].join("\n");
}

function formatLeveledEntries(collection) {
  if (!collection || typeof collection !== "object") return [];

  return Object.entries(collection)
    .map(([key, level]) => ({
      key,
      label: humanizeKey(key),
      level: Number(level)
    }))
    .filter((entry) => Number.isFinite(entry.level))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"))
    .map((entry) => `**${entry.label}** • ${entry.level}`);
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