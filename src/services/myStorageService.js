import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const PLAYERS_DIR = path.join(DATA_DIR, "players");

export async function saveRawImport(discordId, playerTag, payload) {
  const filePath = await getRawFilePath(discordId, playerTag);
  await writeJsonFile(filePath, payload);
  return filePath;
}

export async function saveParsedImport(discordId, playerTag, parsedPayload) {
  const filePath = await getParsedFilePath(discordId, playerTag);
  await writeJsonFile(filePath, parsedPayload);
  return filePath;
}

export async function upsertPlayerProfile(discordId, playerTag) {
  await ensurePlayerDirs(discordId);

  const profilePath = getProfilePath(discordId);
  const now = getUnixTimestamp();

  const currentProfile = await readJsonFile(profilePath, {
    discordId,
    accounts: [],
    mainAccount: null,
    createdAt: now,
    lastImportAt: now
  });

  const accounts = Array.isArray(currentProfile.accounts) ? currentProfile.accounts : [];

  if (!accounts.includes(playerTag)) {
    accounts.push(playerTag);
  }

  const nextProfile = {
    discordId,
    accounts: accounts.sort((a, b) => a.localeCompare(b)),
    mainAccount: currentProfile.mainAccount || playerTag,
    createdAt: currentProfile.createdAt || now,
    lastImportAt: now
  };

  await writeJsonFile(profilePath, nextProfile);
  return nextProfile;
}

export async function ensurePlayerDirs(discordId) {
  const baseDir = getPlayerBaseDir(discordId);
  const rawDir = path.join(baseDir, "raw");
  const parsedDir = path.join(baseDir, "parsed");

  await fs.mkdir(rawDir, { recursive: true });
  await fs.mkdir(parsedDir, { recursive: true });
}

export function getPlayerBaseDir(discordId) {
  return path.join(PLAYERS_DIR, String(discordId));
}

export function getProfilePath(discordId) {
  return path.join(getPlayerBaseDir(discordId), "profile.json");
}

export async function getRawFilePath(discordId, playerTag) {
  await ensurePlayerDirs(discordId);
  return path.join(getPlayerBaseDir(discordId), "raw", `${sanitizeTag(playerTag)}.json`);
}

export async function getParsedFilePath(discordId, playerTag) {
  await ensurePlayerDirs(discordId);
  return path.join(getPlayerBaseDir(discordId), "parsed", `${sanitizeTag(playerTag)}.json`);
}

async function readJsonFile(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallbackValue;
    }

    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  const directory = path.dirname(filePath);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function sanitizeTag(playerTag) {
  return String(playerTag || "unknown")
    .trim()
    .toUpperCase()
    .replace(/[^#A-Z0-9]/g, "");
}

function getUnixTimestamp() {
  return Math.floor(Date.now() / 1000);
}