import { SlashCommandBuilder } from "discord.js";
import { createImportSession } from "../services/importWebService.js";
import { handleMyProfile } from "../services/myProfileService.js";

const data = new SlashCommandBuilder()
  .setName("my")
  .setDescription("Gestion de ton profil Clash")
  .addSubcommand((sub) =>
    sub
      .setName("import")
      .setDescription("Importer ton export Clash via ClashUp")
  )
  .addSubcommand((sub) =>
    sub
      .setName("profile")
      .setDescription("Voir ton profil Clash")
      .addStringOption((opt) =>
        opt
          .setName("tag")
          .setDescription("Tag du joueur")
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("setmain")
      .setDescription("Définir ton compte principal")
      .addStringOption((opt) =>
        opt
          .setName("tag")
          .setDescription("Tag du joueur")
          .setRequired(true)
      )
  );

async function execute(interaction) {
  console.log("[MY COMMAND] Nouvelle version ClashUp import chargée");

  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case "import": {
      await interaction.deferReply({ ephemeral: true });

      try {
        const session = await createImportSession({
          discordId: interaction.user.id,
          username: interaction.user.username
        });

        await interaction.editReply({
          content:
            `🔗 **Import Clash**\n\n` +
            `${session.link}\n\n` +
            `⚠️ Ce lien expire dans **15 minutes**.\n` +
            `⚠️ Il est **utilisable une seule fois**.\n` +
            `⚠️ Connecte-toi avec **le même compte Discord** que celui qui a lancé la commande.`
        });
      } catch (error) {
        console.error("Import session error:", error);

        await interaction.editReply({
          content:
            `❌ Impossible de créer la session d'import.\n` +
            `Réessaie dans quelques secondes.`
        });
      }

      break;
    }

    case "profile": {
      return handleMyProfile(interaction);
    }

    case "setmain": {
      const tag = interaction.options.getString("tag");

      return interaction.reply({
        content: `Commande setmain à reconnecter au service existant pour ${tag}.`,
        ephemeral: true
      });
    }

    default: {
      return interaction.reply({
        content: "Sous-commande inconnue.",
        ephemeral: true
      });
    }
  }
}

export default {
  data,
  execute
};