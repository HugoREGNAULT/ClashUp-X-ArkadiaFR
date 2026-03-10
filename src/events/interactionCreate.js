import { logCommandError, logCommandUsage } from "../services/logger.js";
import { handleMyProfileButton } from "../services/myProfileService.js";

export default {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      if (interaction.isButton()) {
        const handled = await handleMyProfileButton(interaction);
        if (handled) return;
      }

      if (!interaction.isChatInputCommand()) {
        return;
      }

      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        return;
      }

      await logCommandUsage(interaction);
      await command.execute(interaction);
    } catch (error) {
      console.error("❌ Erreur interactionCreate :", error);

      if (interaction.isChatInputCommand()) {
        await logCommandError(interaction, error);
      }

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            content: "Une erreur est survenue pendant l’exécution de la commande."
          });
        } else {
          await interaction.reply({
            content: "Une erreur est survenue pendant l’exécution de la commande.",
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.error("❌ Impossible de répondre après erreur :", replyError);
      }
    }
  }
};