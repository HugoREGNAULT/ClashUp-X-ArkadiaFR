import { processDueReminders } from "../services/reminderService.js";
import { logBotError } from "../services/logger.js";

let reminderInterval = null;

export function startReminderLoop(client, env) {
  if (reminderInterval) {
    clearInterval(reminderInterval);
  }

  const intervalMs = (env.REMINDER_CHECK_INTERVAL_SECONDS || 60) * 1000;

  reminderInterval = setInterval(async () => {
    try {
      await processDueReminders(client);
    } catch (error) {
      console.error("❌ Erreur reminder loop :", error);
      await logBotError(client, "Erreur reminder loop", error);
    }
  }, intervalMs);

  console.log(
    `✅ Reminder loop active (${env.REMINDER_CHECK_INTERVAL_SECONDS || 60}s)`
  );
}