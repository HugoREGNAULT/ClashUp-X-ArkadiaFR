import { SlashCommandBuilder } from "discord.js";
import { handleMyImport } from "../services/myImportService.js";
import {
  handleMyProfile,
  handleMySetMain
} from "../services/myProfileService.js";

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
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("profile")
      .setDescription("Affiche ton profil Clash importé")
      .addStringOption((option) =>
        option
          .setName("tag")
          .setDescription("Tag du compte à afficher (sinon compte principal)")
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("setmain")
      .setDescription("Définit ton compte principal")
      .addStringOption((option) =>
        option
          .setName("tag")
          .setDescription("Tag du compte à définir comme principal")
          .setRequired(true)
      )
  );

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "import") {
    return handleMyImport(interaction);
  }

  if (subcommand === "profile") {
    return handleMyProfile(interaction);
  }

  if (subcommand === "setmain") {
    return handleMySetMain(interaction);
  }

  return interaction.reply({
    content: "Sous-commande inconnue."
  });
}

export default {
  data,
  execute
};