import axios from "axios";
import { MessageFlags } from "discord.js";
import {
  buildMyImportError,
  buildMyImportProgress,
  buildMyImportSuccess
} from "../builders/myMessageBuilder.js";
import { parsePlayerExport } from "./myParserService.js";
import {
  saveParsedImport,
  saveRawImport,
  upsertPlayerProfile
} from "./myStorageService.js";
import {
  validateImportAttachment,
  validateImportedPayload
} from "../validators/myImportValidator.js";
import { logBotError, logInfo } from "./logger.js";

export async function handleMyImport(interaction) {
  const attachment = interaction.options.getAttachment("file");

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  try {
    const attachmentValidation = validateImportAttachment(attachment);

    if (!attachmentValidation.ok) {
      return interaction.editReply(buildMyImportError(attachmentValidation.error));
    }

    await interaction.editReply(
      buildMyImportProgress("Téléchargement du fichier", [
        `Fichier détecté : \`${attachment.name}\``,
        `Taille : ${formatBytes(attachment.size ?? 0)}`
      ])
    );

    const rawPayload = await downloadJsonAttachment(attachment.url);

    await interaction.editReply(
      buildMyImportProgress("Validation du JSON", [
        "Le fichier a été téléchargé.",
        "Analyse de la structure en cours."
      ])
    );

    const payloadValidation = validateImportedPayload(rawPayload);

    if (!payloadValidation.ok) {
      return interaction.editReply(buildMyImportError(payloadValidation.error));
    }

    await interaction.editReply(
      buildMyImportProgress("Parsing des données", [
        "Extraction des héros",
        "Extraction des pets",
        "Extraction des équipements",
        "Extraction des bâtiments"
      ])
    );

    const parsed = parsePlayerExport(rawPayload, interaction.user.id);

    await interaction.editReply(
      buildMyImportProgress("Sauvegarde des données", [
        "Écriture du JSON brut",
        "Écriture du JSON parsé",
        "Mise à jour du profil joueur"
      ])
    );

    const rawPath = await saveRawImport(interaction.user.id, parsed.playerTag, rawPayload);
    const parsedPath = await saveParsedImport(interaction.user.id, parsed.playerTag, parsed);
    const profile = await upsertPlayerProfile(interaction.user.id, parsed.playerTag);

    await interaction.editReply(buildMyImportSuccess(parsed, profile));

    await logInfo(
      interaction.client,
      "📥 Import /my",
      [
        `**Utilisateur :** ${interaction.user.tag} (\`${interaction.user.id}\`)`,
        `**Compte :** ${parsed.playerTag}`,
        `**HDV :** ${parsed.townHall ?? "Inconnu"}`,
        `**Raw :** \`${rawPath}\``,
        `**Parsed :** \`${parsedPath}\``
      ].join("\n")
    );
  } catch (error) {
    console.error("[MY IMPORT] Erreur :", error);

    await logBotError(
      interaction.client,
      "Erreur /my import",
      error,
      `Utilisateur: ${interaction.user.tag} (${interaction.user.id})`
    );

    return interaction.editReply(
      buildMyImportError("L'import a échoué. Vérifie que ton fichier est bien un export JSON Clash valide.")
    );
  }
}

async function downloadJsonAttachment(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20_000,
    maxContentLength: 5 * 1024 * 1024,
    maxBodyLength: 5 * 1024 * 1024
  });

  const rawText = Buffer.from(response.data).toString("utf8").trim();

  if (!rawText) {
    throw new Error("Le fichier est vide.");
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    throw new Error(`JSON invalide : ${error.message}`);
  }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}