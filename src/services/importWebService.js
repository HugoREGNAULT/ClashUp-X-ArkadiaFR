export async function createImportSession({ discordId, username }) {
    const baseUrl = process.env.IMPORT_SERVER_BASE_URL;
    const internalKey = process.env.INTERNAL_API_KEY;
  
    if (!baseUrl) {
      throw new Error("IMPORT_SERVER_BASE_URL not defined");
    }
  
    const response = await fetch(`${baseUrl}/api/create-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": internalKey
      },
      body: JSON.stringify({
        discordId,
        username
      })
    });
  
    const rawText = await response.text();
  
    let data = null;
  
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (error) {
      console.error("[IMPORT WEB] Réponse non JSON :", {
        status: response.status,
        statusText: response.statusText,
        body: rawText.slice(0, 1000)
      });
  
      throw new Error(
        `Import server returned non-JSON response (${response.status} ${response.statusText})`
      );
    }
  
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "failed_to_create_import_session");
    }
  
    return data;
  }