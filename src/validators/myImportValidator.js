export function validateImportAttachment(attachment) {
  if (!attachment) {
    return {
      ok: false,
      error: "Aucun fichier n’a été fourni."
    };
  }

  const maxSize = 5 * 1024 * 1024;
  const fileName = String(attachment.name || "").toLowerCase();
  const contentType = String(attachment.contentType || "").toLowerCase();

  if ((attachment.size ?? 0) <= 0) {
    return {
      ok: false,
      error: "Le fichier est vide."
    };
  }

  if ((attachment.size ?? 0) > maxSize) {
    return {
      ok: false,
      error: "Le fichier dépasse la limite de 5 MB."
    };
  }

  const looksLikeJson = fileName.endsWith(".json") || contentType.includes("json");

  if (!looksLikeJson) {
    return {
      ok: false,
      error: "Le fichier doit être un JSON valide."
    };
  }

  if (!attachment.url) {
    return {
      ok: false,
      error: "Impossible de récupérer le fichier envoyé."
    };
  }

  return { ok: true };
}

export function validateImportedPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      error: "Le contenu JSON doit être un objet."
    };
  }

  const hasUsefulKeys =
    hasAtLeastOneKey(payload, ["tag", "playerTag", "player"]) ||
    hasAtLeastOneKey(payload, ["heroes", "heroes2", "pets", "equipment", "buildings"]) ||
    hasNestedUsefulKeys(payload);

  if (!hasUsefulKeys) {
    return {
      ok: false,
      error: "Le JSON ne ressemble pas à un export Clash exploitable."
    };
  }

  return { ok: true };
}

function hasAtLeastOneKey(target, keys) {
  return keys.some((key) => key in target);
}

function hasNestedUsefulKeys(payload) {
  const nestedKeys = ["player", "data", "village", "profile", "homeVillage", "export"];

  return nestedKeys.some((key) => {
    const candidate = payload[key];
    return (
      candidate &&
      typeof candidate === "object" &&
      ["tag", "playerTag", "heroes", "heroes2", "pets", "equipment", "buildings"].some(
        (nestedKey) => nestedKey in candidate
      )
    );
  });
}