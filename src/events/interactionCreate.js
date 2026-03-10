import { logCommandUsage, logCommandError } from "../services/logger.js";
import {
handleMyImport,
handleMyProfile,
handleMySetMain,
handleMyProfileButton
} from "../services/myProfileService.js";

export default {
name: "interactionCreate",

async execute(interaction) {


try {

  /* ---------------- COMMANDES ---------------- */

  if (interaction.isChatInputCommand()) {

    await logCommandUsage(interaction);

    const { commandName } = interaction;

    if (commandName === "my") {

      const sub = interaction.options.getSubcommand();

      if (sub === "import") {
        return handleMyImport(interaction);
      }

      if (sub === "profile") {
        return handleMyProfile(interaction);
      }

      if (sub === "setmain") {
        return handleMySetMain(interaction);
      }

    }

    return;
  }

  /* ---------------- MENUS / BOUTONS ---------------- */

  if (interaction.isStringSelectMenu()) {

    const handled = await handleMyProfileButton(interaction);

    if (handled) return;

  }

} catch (error) {

  console.error("❌ Erreur interactionCreate :", error);

  if (!interaction.replied && !interaction.deferred) {

    await interaction.reply({
      content: "Une erreur est survenue.",
      ephemeral: true
    });

  }

  await logCommandError(interaction, error);

}

}
};
