import axios from "axios";

export async function fetchPlayerFromAPI(playerTag, token) {
  if (!playerTag) {
    throw new Error("Tag joueur manquant.");
  }

  if (!token) {
    throw new Error("COC_API_TOKEN manquant.");
  }

  const encodedTag = encodeURIComponent(String(playerTag).trim().toUpperCase());

  const response = await axios.get(
    `https://api.clashofclans.com/v1/players/${encodedTag}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 15000
    }
  );

  return response.data;
}