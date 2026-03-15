import { SlashCommandBuilder } from "discord.js";
import { handleCard } from "../services/cardService.js";

export default {
  data: new SlashCommandBuilder()
    .setName("card")
    .setDescription("Affiche la carte visuelle de progression du village"),

  async execute(interaction) {
    await handleCard(interaction);
  }
};