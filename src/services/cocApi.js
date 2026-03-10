import axios from "axios";

function normalizeTag(tag) {
  const clean = tag.trim().toUpperCase().replace(/\s+/g, "");
  const withHash = clean.startsWith("#") ? clean : `#${clean}`;
  return encodeURIComponent(withHash);
}

function createApi(token) {
  return axios.create({
    baseURL: "https://api.clashofclans.com/v1",
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

async function safeGet(api, url, config = {}) {
  try {
    const response = await api.get(url, config);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    if (error.response?.status === 403) return null;
    throw error;
  }
}

export async function getClan(tag, token) {
  const api = createApi(token);
  return safeGet(api, `/clans/${normalizeTag(tag)}`);
}

export async function getMembers(tag, token) {
  const api = createApi(token);
  const data = await safeGet(api, `/clans/${normalizeTag(tag)}/members`);
  return data?.items ?? [];
}

export async function getWarLog(tag, token, limit = 10) {
  const api = createApi(token);
  const data = await safeGet(api, `/clans/${normalizeTag(tag)}/warlog`, {
    params: { limit }
  });

  return data?.items ?? [];
}

export async function getCurrentWar(tag, token) {
  const api = createApi(token);
  return safeGet(api, `/clans/${normalizeTag(tag)}/currentwar`);
}

export async function getLeagueGroup(tag, token) {
  const api = createApi(token);
  return safeGet(api, `/clans/${normalizeTag(tag)}/currentwar/leaguegroup`);
}