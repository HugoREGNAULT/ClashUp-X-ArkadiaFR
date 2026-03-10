import { SlashCommandBuilder } from "discord.js";
import { buildWikiMyV2 } from "../builders/wikiMessageBuilder.js";

export const data = new SlashCommandBuilder()
  .setName("wiki")
  .setDescription("Documentation rapide des commandes du bot")
  .addStringOption((option) =>
    option
      .setName("topic")
      .setDescription("Sujet de la documentation")
      .setRequired(true)
      .addChoices(
        { name: "my", value: "my" }
      )
  );

export async function execute(interaction) {
  const topic = interaction.options.getString("topic", true);

  if (topic === "my") {
    return interaction.reply(buildWikiMyV2());
  }

  return interaction.reply({
    content: "Sujet wiki inconnu."
  });
}

export default {
  data,
  execute
};