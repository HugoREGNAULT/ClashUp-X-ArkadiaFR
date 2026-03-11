import http from "node:http";

let started = false;

export function startImportBridgeServer({ client, processWebImport }) {
  if (started) return;
  started = true;

  const port = Number(process.env.IMPORT_BRIDGE_PORT || 3210);
  const internalKey = process.env.INTERNAL_API_KEY;
  const adminChannelId =
    process.env.IMPORT_ADMIN_ALERT_CHANNEL_ID || "1481320987520663773";

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "method_not_allowed" }));
        return;
      }

      const providedKey = req.headers["x-internal-key"];

      if (!internalKey || providedKey !== internalKey) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "unauthorized" }));
        return;
      }

      let rawBody = "";

      req.on("data", (chunk) => {
        rawBody += chunk.toString();

        if (rawBody.length > 25 * 1024 * 1024) {
          req.destroy();
        }
      });

      req.on("end", async () => {
        let body = {};

        try {
          body = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "invalid_json" }));
          return;
        }

        /*
        =============================
        ADMIN ALERT (>5MB)
        =============================
        */

        if (req.url === "/internal/imports/admin-alert") {
          try {
            const {
              token,
              discordId,
              username,
              bytes,
              formattedSize,
              method,
              filename
            } = body || {};

            const channel = await client.channels.fetch(adminChannelId);

            if (!channel?.isTextBased()) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "admin_channel_not_found" }));
              return;
            }

            await channel.send({
              content:
                `⚠️ **Upload import > 5 MB**\n` +
                `User: <@${discordId}>\n` +
                `Username: \`${username || "unknown"}\`\n` +
                `Token: \`${token}\`\n` +
                `Size: \`${formattedSize || bytes}\`\n` +
                `Method: \`${method || "unknown"}\`\n` +
                `Filename: \`${filename || "none"}\``
            });

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
            return;
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "failed_to_send_admin_alert",
                message: error.message
              })
            );
            return;
          }
        }

        /*
        =============================
        IMPORT PROCESS
        =============================
        */

        if (req.url === "/internal/imports/process") {
          try {
            const result = await processWebImport(body || {});

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, result }));
            return;
          } catch (error) {
            console.error("[IMPORT BRIDGE ERROR]", error);

            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "failed_to_process_import",
                message: error.message
              })
            );
            return;
          }
        }

        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "not_found" }));
      });
    } catch (error) {
      console.error("[IMPORT BRIDGE FATAL]", error);

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "internal_server_error",
          message: error.message
        })
      );
    }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[IMPORT BRIDGE] listening on 0.0.0.0:${port}`);
  });
}
