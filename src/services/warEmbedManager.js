import { buildWarV2Message } from "../builders/warEmbedBuilder.js";
import { readWarStore, setWarEmbedMessageId } from "./warJsonStore.js";

async function ensureOrUpdateOne({
  client,
  key,
  channelId,
  clanTag,
  token
}) {
  const store = readWarStore();
  const cfg = store[key] || { messageId: null };

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    console.error(`Salon GDC introuvable ou non textuel: ${channelId}`);
    return;
  }

  const payload = await buildWarV2Message({
    clanTag,
    token
  });

  if (!cfg.messageId) {
    const sent = await channel.send(payload);
    setWarEmbedMessageId(key, sent.id);
    console.log(`✅ Message GDC ${key} envoyé (${sent.id})`);
    return;
  }

  const existingMessage = await channel.messages.fetch(cfg.messageId).catch(() => null);

  if (!existingMessage) {
    const resent = await channel.send(payload);
    setWarEmbedMessageId(key, resent.id);
    console.log(`♻️ Message GDC ${key} recréé (${resent.id})`);
    return;
  }

  await existingMessage.edit(payload);
  console.log(`🔄 Message GDC ${key} mis à jour (${existingMessage.id})`);
}

export async function ensureAndUpdateWarEmbeds(client, env) {
  await ensureOrUpdateOne({
    client,
    key: "ARKADIA",
    channelId: env.WAR_EMBEDS_CHANNEL_ID,
    clanTag: `#${env.CLAN_ARKADIA}`,
    token: env.COC_API_TOKEN
  });

  await ensureOrUpdateOne({
    client,
    key: "POLIS",
    channelId: env.WAR_EMBEDS_CHANNEL_ID,
    clanTag: `#${env.CLAN_POLIS}`,
    token: env.COC_API_TOKEN
  });
}