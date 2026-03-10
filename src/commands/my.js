import { SlashCommandBuilder } from "discord.js";
import { handleMyImport } from "../services/myImportService.js";

export const data = new SlashCommandBuilder()
  .setName("my")
  .setDescription("Gère tes imports personnels Clash of Clans")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("import")
      .setDescription("Importe un export JSON Clash of Clans")
      .addAttachmentOption((option) =>
        option
          .setName("file")
          .setDescription("Fichier JSON à importer")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("Lien ou ID d’un message Discord contenant le JSON")
          .setRequired(false)
      )
  );

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "import") {
    return handleMyImport(interaction);
  }

  return interaction.reply({
    content: "Sous-commande inconnue."
  });
}

export default {
  data,
  execute
};