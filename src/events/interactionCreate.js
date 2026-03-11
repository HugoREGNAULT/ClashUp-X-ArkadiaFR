export default {
  name: "interactionCreate",

  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          console.warn(`[INTERACTION] Commande inconnue: ${interaction.commandName}`);
          return;
        }

        await command.execute(interaction);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        return;
      }

      if (interaction.isButton()) {
        return;
      }
    } catch (error) {
      console.error("[INTERACTION] Erreur:", error);

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            content: "❌ Une erreur est survenue pendant l'exécution de la commande."
          });
        } else if (interaction.isRepliable()) {
          await interaction.reply({
            content: "❌ Une erreur est survenue pendant l'exécution de la commande.",
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.error("[INTERACTION] Impossible d'envoyer le message d'erreur:", replyError);
      }
    }
  }
};