import { ActivityType, Events } from "discord.js";
import { ensureAndUpdateEmbeds } from "../services/embedManager.js";
import { startEmbedScheduler } from "../services/scheduler.js";
import { logRegisteredClansWarStats } from "../services/startupClanLogger.js";
import { startWarLoop } from "../jobs/warLoop.js";
import { startReminderLoop } from "../jobs/reminderLoop.js";
import { logBotError, logInfo } from "../services/logger.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);

    await client.user.setPresence({
      activities: [
        {
          name: client.env.BOT_STATUS_TEXT,
          type: ActivityType.Watching
        }
      ],
      status: "online"
    });

    console.log("✅ Status appliqué");

    try {
      await logRegisteredClansWarStats(client.env);
    } catch (error) {
      console.error("❌ Erreur startup report :", error);
      await logBotError(client, "Erreur startup report", error);
    }

    try {
      await ensureAndUpdateEmbeds(client, client.env);
      console.log("✅ Embeds clans initialisés / mis à jour");
    } catch (error) {
      console.error("❌ Erreur update initiale des embeds clans :", error);
      await logBotError(client, "Erreur update initiale embeds", error);
    }

    try {
      await startWarLoop(client, client.env);
      console.log("✅ Feed GDC lancé");
    } catch (error) {
      console.error("❌ Erreur feed GDC :", error);
      await logBotError(client, "Erreur lancement war loop", error);
    }

    try {
      startReminderLoop(client, client.env);
      console.log("✅ Reminder loop lancée");
    } catch (error) {
      console.error("❌ Erreur reminder loop :", error);
      await logBotError(client, "Erreur lancement reminder loop", error);
    }

    startEmbedScheduler(client, client.env);

    await logInfo(
      client,
      "✅ Bot prêt",
      `Le bot est connecté en tant que **${client.user.tag}**.`
    );
  }
};