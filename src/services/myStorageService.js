// /src/services/myStorageService.js
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

export async function getPlayerProfile(discordId) {
  const profilePath = getProfilePath(discordId);
  const profile = await readJsonFile(profilePath, null);

  if (!profile) return null;

  return {
    discordId: String(profile.discordId || discordId),
    accounts: Array.isArray(profile.accounts) ? profile.accounts : [],
    mainAccount: profile.mainAccount || null,
    createdAt: profile.createdAt || null,
    lastImportAt: profile.lastImportAt || null
  };
}

export async function getLinkedAccounts(discordId) {
  const profile = await getPlayerProfile(discordId);
  return profile?.accounts || [];
}

export async function getParsedImport(discordId, playerTag) {
  const normalizedTag = sanitizePlayerTag(playerTag);
  const filePath = await getParsedFilePath(discordId, normalizedTag);
  return readJsonFile(filePath, null);
}

export async function getMainParsedImport(discordId) {
  const profile = await getPlayerProfile(discordId);

  if (!profile) return null;

  if (profile.mainAccount) {
    const mainParsed = await getParsedImport(discordId, profile.mainAccount);
    if (mainParsed) return mainParsed;
  }

  if (profile.accounts.length > 0) {
    return getParsedImport(discordId, profile.accounts[0]);
  }

  return null;
}

export async function upsertPlayerProfile(discordId, playerTag) {
  await ensurePlayerDirs(discordId);

  const normalizedTag = sanitizePlayerTag(playerTag);
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

  if (!accounts.includes(normalizedTag)) {
    accounts.push(normalizedTag);
  }

  const nextProfile = {
    discordId: String(discordId),
    accounts: accounts.sort((a, b) => a.localeCompare(b)),
    mainAccount: currentProfile.mainAccount || normalizedTag,
    createdAt: currentProfile.createdAt || now,
    lastImportAt: now
  };

  await writeJsonFile(profilePath, nextProfile);
  return nextProfile;
}

export async function setMainAccount(discordId, playerTag) {
  const normalizedTag = sanitizePlayerTag(playerTag);
  const profile = await getPlayerProfile(discordId);

  if (!profile) {
    throw new Error("Aucun profil /my n’existe encore pour ce compte Discord.");
  }

  if (!profile.accounts.includes(normalizedTag)) {
    throw new Error("Ce tag n’est pas lié à ton profil.");
  }

  const parsed = await getParsedImport(discordId, normalizedTag);

  if (!parsed) {
    throw new Error("Aucune donnée parsée trouvée pour ce tag.");
  }

  const updatedProfile = {
    ...profile,
    mainAccount: normalizedTag,
    lastImportAt: profile.lastImportAt || getUnixTimestamp()
  };

  await writeJsonFile(getProfilePath(discordId), updatedProfile);
  return updatedProfile;
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
  return path.join(getPlayerBaseDir(discordId), "raw", `${sanitizePlayerTag(playerTag)}.json`);
}

export async function getParsedFilePath(discordId, playerTag) {
  await ensurePlayerDirs(discordId);
  return path.join(getPlayerBaseDir(discordId), "parsed", `${sanitizePlayerTag(playerTag)}.json`);
}

export function sanitizePlayerTag(playerTag) {
  return String(playerTag || "#UNKNOWN")
    .trim()
    .toUpperCase()
    .replace(/[^#A-Z0-9]/g, "")
    .replace(/^(?!#)/, "#");
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

function getUnixTimestamp() {
  return Math.floor(Date.now() / 1000);
}