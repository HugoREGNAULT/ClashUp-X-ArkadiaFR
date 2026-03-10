import axios from "axios";
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

const MIN_PROGRESS_DURATION_MS = 14_000;
const STEP_DELAY_MS = 1_750;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function handleMyImport(interaction) {
  const attachment = interaction.options.getAttachment("file");
  const messageRef = interaction.options.getString("message");

  await interaction.deferReply();

  const startedAt = Date.now();

  try {
    if (!attachment && !messageRef) {
      return interaction.editReply(
        buildMyImportErrorV2(
          "Tu dois fournir soit un fichier JSON, soit un lien/ID de message Discord contenant le JSON."
        )
      );
    }

    let resolvedSourceLabel = "Source inconnue";

    const importJobPromise = (async () => {
      const source = await resolveImportSource(interaction, {
        attachment,
        messageRef
      });

      resolvedSourceLabel = source.label;

      const payloadValidation = validateImportedPayload(source.payload);

      if (!payloadValidation.ok) {
        throw new Error(payloadValidation.error);
      }

      const parsed = parsePlayerExport(source.payload, interaction.user.id);

      const rawPath = await saveRawImport(interaction.user.id, parsed.playerTag, source.payload);
      const parsedPath = await saveParsedImport(interaction.user.id, parsed.playerTag, parsed);
      const profile = await upsertPlayerProfile(interaction.user.id, parsed.playerTag);

      return {
        parsed,
        profile,
        rawPath,
        parsedPath,
        sourceLabel: source.label
      };
    })();

    const steps = [
      {
        title: "Préparation de l’import",
        description: "Initialisation de la session joueur",
        percent: 6
      },
      {
        title: "Récupération de la source",
        description: attachment
          ? "Téléchargement du fichier JSON"
          : "Lecture du message Discord ciblé",
        percent: 14
      },
      {
        title: "Validation du contenu",
        description: "Vérification de la structure JSON",
        percent: 24
      },
      {
        title: "Analyse du village",
        description: "Lecture du tag, HDV et métadonnées",
        percent: 38
      },
      {
        title: "Parsing des héros",
        description: "Extraction des héros principaux et BDC",
        percent: 52
      },
      {
        title: "Parsing des pets et équipements",
        description: "Lecture des pets et équipements héroïques",
        percent: 68
      },
      {
        title: "Parsing des bâtiments",
        description: "Construction de la couche métier",
        percent: 82
      },
      {
        title: "Sauvegarde joueur",
        description: "Écriture des fichiers raw / parsed / profile",
        percent: 94
      }
    ];

    let jobDone = false;
    let jobResult = null;
    let jobError = null;

    importJobPromise
      .then((result) => {
        jobDone = true;
        jobResult = result;
      })
      .catch((error) => {
        jobDone = true;
        jobError = error;
      });

    for (const step of steps) {
      await interaction.editReply(
        buildMyImportProgressV2({
          title: step.title,
          description: step.description,
          percent: step.percent,
          sourceLabel: resolvedSourceLabel
        })
      );

      await sleep(STEP_DELAY_MS);
    }

    while (!jobDone || Date.now() - startedAt < MIN_PROGRESS_DURATION_MS) {
      const elapsed = Date.now() - startedAt;
      const waitingPercent = Math.min(98, 94 + Math.floor((elapsed - 10_000) / 1000));

      await interaction.editReply(
        buildMyImportProgressV2({
          title: "Finalisation",
          description: "Synchronisation et consolidation des données",
          percent: waitingPercent,
          sourceLabel: resolvedSourceLabel
        })
      );

      await sleep(1_200);

      if (jobDone && Date.now() - startedAt >= MIN_PROGRESS_DURATION_MS) {
        break;
      }
    }

    if (jobError) {
      throw jobError;
    }

    const { parsed, profile, rawPath, parsedPath, sourceLabel } = jobResult;

    await interaction.editReply(
      buildMyImportSuccessV2({
        parsed,
        profile,
        sourceLabel
      })
    );

    await logInfo(
      interaction.client,
      "📥 Import /my",
      [
        `**Utilisateur :** ${interaction.user.tag} (\`${interaction.user.id}\`)`,
        `**Compte :** ${parsed.playerTag}`,
        `**HDV :** ${parsed.townHall ?? "Inconnu"}`,
        `**Source :** ${sourceLabel}`,
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
      buildMyImportErrorV2(
        error?.message || "L'import a échoué. Vérifie la source JSON envoyée."
      )
    );
  }
}

async function resolveImportSource(interaction, { attachment, messageRef }) {
  if (attachment) {
    validateAttachment(attachment);

    const payload = await downloadJsonAttachment(attachment.url);

    return {
      payload,
      label: `Fichier : ${attachment.name}`
    };
  }

  const message = await fetchTargetMessage(interaction, messageRef);

  if (!message) {
    throw new Error("Impossible de récupérer le message Discord indiqué.");
  }

  const jsonAttachment = [...message.attachments.values()].find((file) => {
    const fileName = String(file.name || "").toLowerCase();
    const contentType = String(file.contentType || "").toLowerCase();

    return fileName.endsWith(".json") || contentType.includes("json");
  });

  if (jsonAttachment) {
    validateAttachment(jsonAttachment);

    const payload = await downloadJsonAttachment(jsonAttachment.url);

    return {
      payload,
      label: `Message Discord (${message.id}) + fichier ${jsonAttachment.name}`
    };
  }

  const extractedJson = extractJsonFromContent(message.content);

  if (!extractedJson) {
    throw new Error(
      "Le message Discord ne contient ni fichier JSON ni contenu JSON exploitable."
    );
  }

  try {
    return {
      payload: JSON.parse(extractedJson),
      label: `Message Discord (${message.id})`
    };
  } catch (error) {
    throw new Error(`Le JSON du message est invalide : ${error.message}`);
  }
}

function validateAttachment(attachment) {
  const fileName = String(attachment.name || "").toLowerCase();
  const contentType = String(attachment.contentType || "").toLowerCase();

  if ((attachment.size ?? 0) <= 0) {
    throw new Error("Le fichier est vide.");
  }

  if ((attachment.size ?? 0) > MAX_FILE_SIZE) {
    throw new Error("Le fichier dépasse la limite de 5 MB.");
  }

  if (!attachment.url) {
    throw new Error("Impossible de télécharger le fichier fourni.");
  }

  const looksLikeJson = fileName.endsWith(".json") || contentType.includes("json");

  if (!looksLikeJson) {
    throw new Error("Le fichier fourni doit être un JSON.");
  }
}

async function downloadJsonAttachment(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20_000,
    maxContentLength: MAX_FILE_SIZE,
    maxBodyLength: MAX_FILE_SIZE
  });

  const rawText = Buffer.from(response.data).toString("utf8").trim();

  if (!rawText) {
    throw new Error("Le contenu téléchargé est vide.");
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    throw new Error(`JSON invalide : ${error.message}`);
  }
}

async function fetchTargetMessage(interaction, messageRef) {
  if (!messageRef) return null;

  const linkMatch = String(messageRef).match(
    /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/channels\/(\d+|@me)\/(\d+)\/(\d+)/
  );

  let channelId = null;
  let messageId = null;

  if (linkMatch) {
    channelId = linkMatch[2];
    messageId = linkMatch[3];
  } else {
    messageId = String(messageRef).trim();
    channelId = interaction.channelId;
  }

  if (!channelId || !messageId) {
    return null;
  }

  const channel = await interaction.client.channels.fetch(channelId).catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return null;
  }

  return channel.messages.fetch(messageId).catch(() => null);
}

function extractJsonFromContent(content) {
  const text = String(content || "").trim();

  if (!text) return null;

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch?.[1]) {
    return codeBlockMatch[1].trim();
  }

  if (text.startsWith("{") && text.endsWith("}")) {
    return text;
  }

  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}