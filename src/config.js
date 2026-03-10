require("dotenv").config();

module.exports = {
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  cocApiToken: process.env.COC_API_TOKEN,
  botStatusText: process.env.BOT_STATUS_TEXT || "Clash of Clans"
};