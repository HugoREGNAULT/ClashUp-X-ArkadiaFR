import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { REST, Routes } from "discord.js";
import env from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function deploySlashCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, "..", "commands");

  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = await import(filePath);
    const command = commandModule.default;

    if (command?.data) {
      commands.push(command.data.toJSON());
    }
  }

  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

  try {
    console.log(`🔄 Déploiement automatique de ${commands.length} commande(s) slash...`);

    await rest.put(
      Routes.applicationCommands(env.DISCORD_CLIENT_ID),
      {
        body: commands
      }
    );

    console.log("✅ Commandes slash déployées automatiquement avec succès.");
  } catch (error) {
    console.error("❌ Erreur déploiement automatique des commandes :", error);
    throw error;
  }
}