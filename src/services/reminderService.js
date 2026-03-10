import crypto from "crypto";
import { parseDurationToSeconds, formatDurationFR } from "./timeParser.js";
import {
  addReminder,
  getDueReminders,
  removeReminderById
} from "./reminderStore.js";
import { logBotError, logInfo } from "./logger.js";
import {
  buildReminderCreatedV2,
  buildReminderDmV2,
  buildReminderFallbackV2
} from "../builders/reminderMessageBuilder.js";

function createReminderId() {
  return `rem_${crypto.randomBytes(6).toString("hex")}`;
}

export async function createReminderFromInteraction(interaction) {
  const message = interaction.options.getString("message", true).trim();
  const temps = interaction.options.getString("temps", true).trim();
  const pseudo = interaction.options.getString("pseudo")?.trim() || null;

  if (!message) {
    throw new Error("Le message du reminder ne peut pas être vide.");
  }

  const durationSeconds = parseDurationToSeconds(temps);
  const nowUnix = Math.floor(Date.now() / 1000);
  const remindAt = nowUnix + durationSeconds;

  let dmAvailable = true;

  try {
    await interaction.user.createDM();
  } catch {
    dmAvailable = false;
  }

  const reminder = {
    id: createReminderId(),
    userId: interaction.user.id,
    username: interaction.user.tag,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    message,
    pseudo,
    createdAt: nowUnix,
    remindAt
  };

  addReminder(reminder);

  await interaction.reply({
    ...buildReminderCreatedV2({
      message,
      pseudo,
      durationLabel: formatDurationFR(durationSeconds),
      remindAt,
      dmAvailable
    }),
    ephemeral: true
  });

  await logInfo(
    interaction.client,
    "⏰ Reminder créé",
    [
      `**Utilisateur :** ${interaction.user.tag} (\`${interaction.user.id}\`)`,
      `**Salon fallback :** <#${interaction.channelId}>`,
      `**Message :** ${message}`,
      `**Compte :** ${pseudo || "Non renseigné"}`,
      `**Déclenchement :** <t:${remindAt}:F>`
    ].join("\n")
  );
}

export async function processDueReminders(client) {
  const nowUnix = Math.floor(Date.now() / 1000);
  const dueReminders = getDueReminders(nowUnix);

  if (!dueReminders.length) {
    return;
  }

  for (const reminder of dueReminders) {
    try {
      const user = await client.users.fetch(reminder.userId);
      let sent = false;

      try {
        await user.send(buildReminderDmV2(reminder));
        sent = true;
      } catch (dmError) {
        console.warn(
          `⚠️ Impossible d'envoyer le reminder en MP à ${reminder.userId}, fallback salon.`
        );

        if (reminder.channelId) {
          try {
            const channel = await client.channels.fetch(reminder.channelId);

            if (channel && channel.isTextBased()) {
              await channel.send({
                content: `<@${reminder.userId}>`,
                ...buildReminderFallbackV2(reminder)
              });
              sent = true;
            }
          } catch (channelError) {
            console.error("❌ Impossible d'envoyer le fallback salon :", channelError);
          }
        }

        if (!sent) {
          await logBotError(
            client,
            "Reminder non délivré",
            dmError,
            `Reminder ID: ${reminder.id} | User ID: ${reminder.userId}`
          );
        }
      }

      if (sent) {
        removeReminderById(reminder.id);

        await logInfo(
          client,
          "✅ Reminder envoyé",
          [
            `**Utilisateur :** ${reminder.username || reminder.userId}`,
            `**Message :** ${reminder.message}`,
            `**Compte :** ${reminder.pseudo || "Non renseigné"}`,
            `**Prévu pour :** <t:${reminder.remindAt}:F>`
          ].join("\n")
        );
      }
    } catch (error) {
      console.error("❌ Erreur process reminder :", error);

      await logBotError(
        client,
        "Erreur process reminder",
        error,
        `Reminder ID: ${reminder.id}`
      );
    }
  }
}