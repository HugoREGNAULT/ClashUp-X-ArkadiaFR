import { SlashCommandBuilder } from "discord.js";
import { createReminderFromInteraction } from "../services/reminderService.js";

export default {
  data: new SlashCommandBuilder()
    .setName("reminder")
    .setDescription("Créer un rappel personnel Clash of Clans")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Le message du rappel")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("temps")
        .setDescription("Ex: 2j, 2j 1h, 1h 30min, 45m")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("pseudo")
        .setDescription("Pseudo du compte concerné")
        .setRequired(false)
    ),

  async execute(interaction) {
    await createReminderFromInteraction(interaction);
  }
};