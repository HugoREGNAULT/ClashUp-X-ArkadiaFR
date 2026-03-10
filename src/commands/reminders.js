import { SlashCommandBuilder } from "discord.js";
import { getAllReminders } from "../services/reminderStore.js";
import {
  buildNoRemindersV2,
  buildRemindersListV2
} from "../builders/reminderMessageBuilder.js";

export default {
  data: new SlashCommandBuilder()
    .setName("reminders")
    .setDescription("Afficher tes rappels actifs"),

  async execute(interaction) {
    const reminders = getAllReminders();

    const userReminders = reminders
      .filter((r) => r.userId === interaction.user.id)
      .sort((a, b) => a.remindAt - b.remindAt);

    if (userReminders.length === 0) {
      return interaction.reply({
        ...buildNoRemindersV2(),
        ephemeral: true
      });
    }

    await interaction.reply({
      ...buildRemindersListV2(userReminders),
      ephemeral: true
    });
  }
};