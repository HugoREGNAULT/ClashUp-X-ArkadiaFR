import { ensureAndUpdateEmbeds } from "./embedManager.js";

let interval = null;

export function startEmbedScheduler(client, env) {
  if (interval) clearInterval(interval);

  const ms = env.UPDATE_INTERVAL_MINUTES * 60 * 1000;

  interval = setInterval(async () => {
    try {
      console.log("⏰ Refresh automatique des embeds clans...");
      await ensureAndUpdateEmbeds(client, env);
    } catch (error) {
      console.error("❌ Erreur scheduler embeds clans :", error);
    }
  }, ms);

  console.log(`✅ Scheduler lancé toutes les ${env.UPDATE_INTERVAL_MINUTES} minute(s)`);
}