import crypto from "crypto";
import { EmbedBuilder } from "discord.js";
import { parseDurationToSeconds, formatDurationFR } from "./timeParser.js";
import {
  addReminder,
  getDueReminders,
  removeReminderById
} from "./reminderStore.js";
import { logBotError, logInfo } from "./logger.js";

const EMBED_COLOR = 0xA8DCFF;

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

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("⏰ Reminder enregistré")
    .addFields(
      {
        name: "Message",
        value: message,
        inline: false
      },
      {
        name: "Compte",
        value: pseudo || "Non renseigné",
        inline: true
      },
      {
        name: "Durée",
        value: formatDurationFR(durationSeconds),
        inline: true
      },
      {
        name: "Rappel prévu",
        value: `<t:${remindAt}:F>\n<t:${remindAt}:R>`,
        inline: false
      }
    )
    .setFooter({
      text: dmAvailable
        ? "Le rappel sera envoyé en message privé. Si l’envoi échoue, il sera envoyé dans ce salon."
        : "Je n’ai pas pu confirmer tes MP. Si le MP échoue, le rappel sera envoyé dans ce salon."
    })
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
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

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("⏰ Rappel Clash of Clans")
        .addFields(
          {
            name: "Message",
            value: reminder.message,
            inline: false
          },
          {
            name: "Compte",
            value: reminder.pseudo || "Non renseigné",
            inline: true
          },
          {
            name: "Prévu pour",
            value: `<t:${reminder.remindAt}:F>`,
            inline: true
          }
        )
        .setFooter({
          text: "Arcadia Reminder"
        })
        .setTimestamp();

      let sent = false;

      try {
        await user.send({ embeds: [embed] });
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
                embeds: [
                  EmbedBuilder.from(embed).setFooter({
                    text: "MP indisponible : rappel envoyé dans le salon d'origine"
                  })
                ]
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