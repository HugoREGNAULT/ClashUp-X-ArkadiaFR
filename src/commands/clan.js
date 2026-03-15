import { SlashCommandBuilder } from "discord.js";
import { buildClanV2Message } from "../builders/clanV2MessageBuilder.js";

function normalizeClanTag(tag) {
  const clean = String(tag ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  return clean.startsWith("#") ? clean : `#${clean}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName("clan")
    .setDescription("Affiche les informations d'un clan Clash of Clans")
    .addStringOption((option) =>
      option
        .setName("tag")
        .setDescription("Tag du clan (ex: #2ABC123)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const token =
      process.env.COC_API_TOKEN ||
      process.env.CLASH_API_TOKEN ||
      interaction.client?.env?.COC_API_TOKEN ||
      interaction.client?.env?.CLASH_API_TOKEN;

    if (!token) {
      return interaction.reply({
        content: "❌ Le token API Clash of Clans n'est pas configuré.",
        ephemeral: true
      });
    }

    const clanTag = normalizeClanTag(interaction.options.getString("tag", true));

    await interaction.deferReply();

    try {
      const payload = await buildClanV2Message({
        clanTag,
        token,
        view: "overview",
        memberPage: 0
      });

      return interaction.editReply(payload);
    } catch (error) {
      console.error("[/clan] Erreur:", error);

      const message =
        error?.message === "CLAN_NOT_FOUND"
          ? `❌ Aucun clan trouvé pour le tag \`${clanTag}\`.`
          : "❌ Une erreur est survenue lors de la récupération du clan.";

      return interaction.editReply({
        content: message,
        components: []
      });
    }
  }
};