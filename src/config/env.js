import dotenv from "dotenv";

dotenv.config();

const env = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  COC_API_TOKEN: process.env.COC_API_TOKEN,

  EMBEDS_CHANNEL_ID: process.env.EMBEDS_CHANNEL_ID,
  WAR_FEED_CHANNEL_ID: process.env.WAR_FEED_CHANNEL_ID,
  LOGS_CHANNEL_ID: process.env.LOGS_CHANNEL_ID || "1480869627503317052",

  CLAN_ARKADIA: process.env.CLAN_ARKADIA,
  CLAN_POLIS: process.env.CLAN_POLIS,

  CLAN_ARKADIA_LINK: process.env.CLAN_ARKADIA_LINK,
  CLAN_POLIS_LINK: process.env.CLAN_POLIS_LINK,

  BOT_STATUS_TEXT: process.env.BOT_STATUS_TEXT || "Surveille les clans ⚔️",
  UPDATE_INTERVAL_MINUTES: Number(process.env.UPDATE_INTERVAL_MINUTES || 5),
  REMINDER_CHECK_INTERVAL_SECONDS: Number(
    process.env.REMINDER_CHECK_INTERVAL_SECONDS || 60
  ),
  TIMEZONE: process.env.TIMEZONE || "Europe/Paris"
};

const required = [
  "DISCORD_TOKEN",
  "DISCORD_CLIENT_ID",
  "COC_API_TOKEN",
  "EMBEDS_CHANNEL_ID",
  "WAR_FEED_CHANNEL_ID",
  "CLAN_ARKADIA",
  "CLAN_POLIS",
  "CLAN_ARKADIA_LINK",
  "CLAN_POLIS_LINK"
];

for (const key of required) {
  if (!env[key]) {
    throw new Error(`Variable d'environnement manquante: ${key}`);
  }
}

export default env;