import { EmbedBuilder } from "discord.js";

const LOG_COLOR = 0xA8DCFF;

async function fetchLogsChannel(client) {
  try {
    const channel = await client.channels.fetch(client.env.LOGS_CHANNEL_ID);

    if (!channel || !channel.isTextBased()) {
      return null;
    }

    return channel;
  } catch (error) {
    console.error("❌ Impossible de récupérer le salon de logs :", error);
    return null;
  }
}

async function sendLogEmbed(client, embed) {
  const channel = await fetchLogsChannel(client);
  if (!channel) return;

  try {
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Impossible d'envoyer un log :", error);
  }
}

export async function logInfo(client, title, description) {
  const embed = new EmbedBuilder()
    .setColor(LOG_COLOR)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  await sendLogEmbed(client, embed);
}

export async function logCommandUsage(interaction) {
  const embed = new EmbedBuilder()
    .setColor(LOG_COLOR)
    .setTitle("🛠️ Utilisation de commande")
    .addFields(
      {
        name: "Commande",
        value: `/${interaction.commandName}`,
        inline: true
      },
      {
        name: "Utilisateur",
        value: `${interaction.user.tag}\n\`${interaction.user.id}\``,
        inline: true
      },
      {
        name: "Salon",
        value: interaction.channelId ? `<#${interaction.channelId}>` : "Inconnu",
        inline: true
      },
      {
        name: "Serveur",
        value: interaction.guild
          ? `${interaction.guild.name}\n\`${interaction.guild.id}\``
          : "MP",
        inline: false
      }
    )
    .setTimestamp();

  await sendLogEmbed(interaction.client, embed);
}

export async function logCommandError(interaction, error) {
  const embed = new EmbedBuilder()
    .setColor(LOG_COLOR)
    .setTitle("❌ Erreur commande")
    .setDescription(
      [
        `**Commande :** \`/${interaction.commandName}\``,
        `**Utilisateur :** ${interaction.user.tag} (\`${interaction.user.id}\`)`,
        `**Salon :** ${interaction.channelId ? `<#${interaction.channelId}>` : "Inconnu"}`,
        `**Serveur :** ${interaction.guild ? `${interaction.guild.name} (\`${interaction.guild.id}\`)` : "MP"}`,
        `**Erreur :** \`${error?.message || "Inconnue"}\``
      ].join("\n")
    )
    .setTimestamp();

  if (error?.stack) {
    embed.addFields({
      name: "Stack",
      value: `\`\`\`${String(error.stack).slice(0, 3800)}\`\`\``
    });
  }

  await sendLogEmbed(interaction.client, embed);
}

export async function logBotError(client, title, error, extra = null) {
  const lines = [
    `**Erreur :** \`${error?.message || "Inconnue"}\``
  ];

  if (extra) {
    lines.push(`**Contexte :** ${extra}`);
  }

  const embed = new EmbedBuilder()
    .setColor(LOG_COLOR)
    .setTitle(`❌ ${title}`)
    .setDescription(lines.join("\n"))
    .setTimestamp();

  if (error?.stack) {
    embed.addFields({
      name: "Stack",
      value: `\`\`\`${String(error.stack).slice(0, 3800)}\`\`\``
    });
  }

  await sendLogEmbed(client, embed);
}