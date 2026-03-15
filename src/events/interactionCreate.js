import { handleMyProfileButton } from "../services/myProfileService.js";
import {
  buildClanMemberEphemeralMessage,
  buildClanV2Message
} from "../builders/clanV2MessageBuilder.js";

function getClashToken(client) {
  return (
    process.env.COC_API_TOKEN ||
    process.env.CLASH_API_TOKEN ||
    client?.env?.COC_API_TOKEN ||
    client?.env?.CLASH_API_TOKEN ||
    null
  );
}

function parseClanCustomId(customId) {
  if (!customId?.startsWith("clan_")) return null;

  const parts = customId.split("|");
  const [head, a, b, c] = parts;

  if (head === "clan_view") {
    return {
      type: "view",
      view: a,
      clanTag: b,
      memberPage: Number(c ?? 0) || 0
    };
  }

  if (head === "clan_member_page") {
    return {
      type: "member_page",
      view: a,
      clanTag: b,
      memberPage: Number(c ?? 0) || 0
    };
  }

  if (head === "clan_member_select") {
    return {
      type: "member_select",
      clanTag: a,
      memberPage: Number(b ?? 0) || 0
    };
  }

  if (head === "clan_noop") {
    return {
      type: "noop"
    };
  }

  return null;
}

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
        const clanPayload = parseClanCustomId(interaction.customId);

        if (clanPayload?.type === "member_select") {
          const token = getClashToken(client);

          if (!token) {
            return interaction.reply({
              content: "❌ Le token API Clash of Clans n'est pas configuré.",
              ephemeral: true
            });
          }

          const memberTag = interaction.values?.[0];
          const payload = await buildClanMemberEphemeralMessage({
            clanTag: clanPayload.clanTag,
            token,
            memberTag
          });

          return interaction.reply(payload);
        }

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
        const clanPayload = parseClanCustomId(interaction.customId);

        if (clanPayload?.type === "noop") {
          return interaction.deferUpdate();
        }

        if (clanPayload?.type === "view" || clanPayload?.type === "member_page") {
          const token = getClashToken(client);

          if (!token) {
            return interaction.reply({
              content: "❌ Le token API Clash of Clans n'est pas configuré.",
              ephemeral: true
            });
          }

          await interaction.deferUpdate();

          const payload = await buildClanV2Message({
            clanTag: clanPayload.clanTag,
            token,
            view: clanPayload.type === "view" ? clanPayload.view : clanPayload.view,
            memberPage: clanPayload.memberPage
          });

          return interaction.editReply(payload);
        }

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