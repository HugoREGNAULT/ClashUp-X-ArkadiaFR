import { Events } from "discord.js";
import { logCommandUsage, logCommandError } from "../services/logger.js";

export default {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      return;
    }

    try {
      await logCommandUsage(interaction);
      await command.execute(interaction, client);
    } catch (error) {
      console.error(
        `❌ Erreur exécution commande /${interaction.commandName}:`,
        error
      );

      await logCommandError(interaction, error);

      const replyPayload = {
        content:
          "❌ Une erreur est survenue pendant l'exécution de la commande.",
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyPayload).catch(() => null);
      } else {
        await interaction.reply(replyPayload).catch(() => null);
      }
    }
  }
};