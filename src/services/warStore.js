import fs from "fs";
import path from "path";

const WAR_DIR = path.join(process.cwd(), "data", "wars");

function ensureWarDir() {
  if (!fs.existsSync(WAR_DIR)) {
    fs.mkdirSync(WAR_DIR, { recursive: true });
  }
}

function getWarFilePath(warKey) {
  ensureWarDir();
  return path.join(WAR_DIR, `${warKey}.json`);
}

export function loadWarState(warKey) {
  const filePath = getWarFilePath(warKey);

  if (!fs.existsSync(filePath)) {
    const now = Math.floor(Date.now() / 1000);
    return {
      warKey,
      overviewMessageId: null,
      threadId: null,
      sentEvents: [],
      createdAt: now,
      lastUpdated: now,
      teamSize: null
    };
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data.sentEvents)) data.sentEvents = [];
    if (!data.warKey) data.warKey = warKey;

    return data;
  } catch (err) {
    console.error("[WarStore] Erreur lecture", warKey, err);

    const now = Math.floor(Date.now() / 1000);
    return {
      warKey,
      overviewMessageId: null,
      threadId: null,
      sentEvents: [],
      createdAt: now,
      lastUpdated: now,
      teamSize: null
    };
  }
}

export function saveWarState(warKey, state) {
  const filePath = getWarFilePath(warKey);

  const data = {
    ...state,
    warKey,
    lastUpdated: Math.floor(Date.now() / 1000)
  };

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[WarStore] Erreur écriture", warKey, err);
  }
}