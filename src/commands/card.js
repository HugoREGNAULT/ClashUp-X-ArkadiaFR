import { SlashCommandBuilder } from "discord.js";
import { handleCard } from "../services/cardService.js";

export const data = new SlashCommandBuilder()
  .setName("card")
  .setDescription("Affiche la carte de progression du village");

export async function execute(interaction) {
  await handleCard(interaction);
}