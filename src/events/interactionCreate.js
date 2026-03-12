import { handleMyProfileButton } from "../services/myProfileService.js";

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
        const isMyProfileMenu =
          interaction.customId === "my_profile_nav" ||
          interaction.customId.startsWith("profile_");

        if (!isMyProfileMenu) {
          return;
        }

        const handled = await handleMyProfileButton(interaction);

        if (!handled) {
          console.warn(
            `[INTERACTION] Menu profil non pris en charge: ${interaction.customId}`
          );
        }

        return;
      }

      if (interaction.isButton()) {
        const isMyProfileButton =
          interaction.customId.startsWith("profile_") ||
          interaction.customId.startsWith("my_profile_");

        if (!isMyProfileButton) {
          return;
        }

        const handled = await handleMyProfileButton(interaction);

        if (!handled) {
          console.warn(
            `[INTERACTION] Bouton profil non pris en charge: ${interaction.customId}`
          );
        }

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
          const payload = {
            content: "❌ Une erreur est survenue pendant l'exécution de la commande.",
            ephemeral: true
          };

          if (interaction.isButton() || interaction.isStringSelectMenu()) {
            if (interaction.deferred || interaction.replied) {
              await interaction.followUp(payload);
            } else {
              await interaction.reply(payload);
            }
          } else {
            await interaction.reply(payload);
          }
        }
      } catch (replyError) {
        console.error(
          "[INTERACTION] Impossible d'envoyer le message d'erreur:",
          replyError
        );
      }
    }
  }
};