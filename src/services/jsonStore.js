import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "embeds.json");

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureFileExists(filePath, defaultValue) {
  ensureDirExists(path.dirname(filePath));

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
  }
}

function ensureStoreExists() {
  ensureFileExists(STORE_PATH, {
    ARKADIA: { messageId: null },
    POLIS: { messageId: null }
  });
}

export function readStore() {
  ensureStoreExists();

  const raw = fs.readFileSync(STORE_PATH, "utf8");
  return JSON.parse(raw);
}

export function writeStore(data) {
  ensureStoreExists();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export function setEmbedMessageId(key, messageId) {
  const store = readStore();

  if (!store[key]) {
    store[key] = { messageId: null };
  }

  store[key].messageId = messageId;
  writeStore(store);
}

export function readJsonFile(filePath, defaultValue) {
  ensureFileExists(filePath, defaultValue);

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error(`❌ Erreur lecture JSON: ${filePath}`, error);
    return defaultValue;
  }
}

export function writeJsonFile(filePath, data) {
  ensureFileExists(filePath, data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export function ensureDataDir() {
  ensureDirExists(DATA_DIR);
}

export { DATA_DIR };