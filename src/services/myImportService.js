import {
  buildMyImportErrorV2,
  buildMyImportProgressV2,
  buildMyImportSuccessV2
} from "../builders/myMessageBuilder.js";
import { parsePlayerExport } from "./myParserService.js";
import {
  saveParsedImport,
  saveRawImport,
  upsertPlayerProfile
} from "./myStorageService.js";
import { validateImportedPayload } from "../validators/myImportValidator.js";
import { logBotError, logInfo } from "./logger.js";

export async function handleMyImport(interaction) {
  return interaction.editReply(
    buildMyImportErrorV2(
      "❌ L'import Discord direct n'est plus disponible.\n\n" +
        "Utilise la commande **/my import** pour générer un lien ClashUp et importer ton JSON via le site."
    )
  );
}

export async function processWebImport({
  discordId,
  username,
  jsonData,
  inputMethod,
  filename,
  bytes,
  sourceLabel
}) {
  let payload = jsonData;

  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      throw new Error(`JSON invalide : ${error.message}`);
    }
  }

  const resolvedSourceLabel =
    sourceLabel ||
    (inputMethod === "file_upload"
      ? `Import web : fichier ${filename || "inconnu"}`
      : "Import web : texte collé");

  const result = await runImportPipeline({
    discordId,
    payload,
    sourceLabel: resolvedSourceLabel
  });

  return {
    ok: true,
    sourceLabel: resolvedSourceLabel,
    username: username ?? null,
    bytes: bytes ?? null,
    inputMethod: inputMethod ?? null,
    filename: filename ?? null,
    playerTag: result.parsed.playerTag,
    playerName: result.parsed.playerName,
    townHall: result.parsed.townHall,
    rawPath: result.rawPath,
    parsedPath: result.parsedPath,
    accounts: result.profile?.accounts ?? []
  };
}

async function runImportPipeline({ discordId, payload, sourceLabel }) {
  const payloadValidation = validateImportedPayload(payload);

  if (!payloadValidation.ok) {
    throw new Error(payloadValidation.error);
  }

  const parsed = parsePlayerExport(payload, discordId);

  const rawPath = await saveRawImport(discordId, parsed.playerTag, payload);
  const parsedPath = await saveParsedImport(discordId, parsed.playerTag, parsed);
  const profile = await upsertPlayerProfile(discordId, parsed.playerTag);

  return {
    parsed,
    profile,
    rawPath,
    parsedPath,
    sourceLabel
  };
}