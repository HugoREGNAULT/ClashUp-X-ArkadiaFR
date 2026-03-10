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

    return interaction.reply(
      buildMyProfileViewV2({
        ownerId: interaction.user.id,
        currentView: "overview",
        profile: context.profile,
        parsed: context.parsed,
        apiPlayer,
        title: "Profil joueur",
        body: buildOverviewBody(context.parsed)
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

    await interaction.update(
      buildMyProfileViewV2({
        ownerId,
        currentView: view,
        profile,
        parsed,
        apiPlayer,
        title: getViewTitle(view),
        body: buildViewBody(view, parsed)
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

  if (!profile) {
    return null;
  }

  if (requestedTag) {
    const parsed = await getParsedImport(discordId, requestedTag);
    if (!parsed) return null;

    return {
      profile,
      parsed
    };
  }

  const parsed = await getMainParsedImport(discordId);

  if (!parsed) {
    return null;
  }

  return {
    profile,
    parsed
  };
}

function getViewTitle(view) {
  switch (view) {
    case "overview":
      return "Profil joueur";
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

function buildViewBody(view, parsed) {
  switch (view) {
    case "overview":
      return buildOverviewBody(parsed);
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
      return buildUpgradesBody(parsed);
    default:
      return buildOverviewBody(parsed);
  }
}

function buildOverviewBody(parsed) {
  return [
    `**Héros :** ${parsed.heroesCount ?? countKeys(parsed.heroes)}`,
    `**Troupes :** ${parsed.troopsCount ?? countKeys(parsed.troops)}`,
    `**Sorts :** ${parsed.spellsCount ?? countKeys(parsed.spells)}`,
    `**Familiers :** ${parsed.petsCount ?? countKeys(parsed.pets)}`,
    `**Équipements :** ${parsed.equipmentCount ?? countKeys(parsed.equipment)}`,
    `**Engins :** ${parsed.siegeMachinesCount ?? countKeys(parsed.siegeMachines)}`
  ].join("\n");
}

function buildHeroesBody(parsed) {
  const homeHeroes = formatLeveledEntries(parsed.heroes);
  const builderHeroes = formatLeveledEntries(parsed.builderBase);

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
    return `Aucune donnée disponible pour **${label.toLowerCase()}**.\n\nRéimporte ton village pour remplir cette vue.`;
  }

  return lines.join("\n");
}

function buildWallsBody(parsed) {
  const walls = parsed.walls || { total: 0, byLevel: {} };
  const byLevel = walls.byLevel || {};
  const entries = Object.entries(byLevel)
    .map(([level, count]) => [Number(level), Number(count)])
    .filter(([, count]) => Number.isFinite(count) && count > 0)
    .sort((a, b) => b[0] - a[0]);

  if (!entries.length) {
    return "Aucune donnée de remparts trouvée dans cet import.";
  }

  return [
    `**Total :** ${walls.total ?? 0}`,
    "",
    ...entries.map(([level, count]) => `Niveau ${level} • ${count}`)
  ].join("\n");
}

function buildUpgradesBody(parsed) {
  return [
    "Cette vue servira de **hub d’améliorations**.",
    "",
    `**HDV actuel :** ${parsed.townHall ?? "Inconnu"}`,
    `**Héros connus :** ${parsed.heroesCount ?? countKeys(parsed.heroes)}`,
    `**Troupes connues :** ${parsed.troopsCount ?? countKeys(parsed.troops)}`,
    `**Sorts connus :** ${parsed.spellsCount ?? countKeys(parsed.spells)}`,
    `**Familiers connus :** ${parsed.petsCount ?? countKeys(parsed.pets)}`,
    `**Équipements connus :** ${parsed.equipmentCount ?? countKeys(parsed.equipment)}`,
    `**Engins connus :** ${parsed.siegeMachinesCount ?? countKeys(parsed.siegeMachines)}`,
    "",
    "_La comparaison avec les niveaux max par HDV sera branchée plus tard._"
  ].join("\n");
}

function formatLeveledEntries(collection) {
  if (!collection || typeof collection !== "object") {
    return [];
  }

  return Object.entries(collection)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, level]) => `**${humanizeKey(key)}** • ${level}`);
}

function countKeys(collection) {
  if (!collection || typeof collection !== "object") return 0;
  return Object.keys(collection).length;
}

function humanizeKey(key) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}