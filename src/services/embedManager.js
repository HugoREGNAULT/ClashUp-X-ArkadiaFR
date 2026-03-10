import { buildClanV2Message } from "../builders/clanEmbedBuilder.js";
import { readStore, setEmbedMessageId } from "./jsonStore.js";

async function ensureOrUpdateOne({
  client,
  key,
  channelId,
  clanTag,
  clanLink,
  token
}) {
  const store = readStore();
  const cfg = store[key] || { messageId: null };

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    console.error(`Salon introuvable ou non textuel: ${channelId}`);
    return;
  }

  const payload = await buildClanV2Message({
    clanTag,
    clanLink,
    token
  });

  if (!cfg.messageId) {
    const sent = await channel.send(payload);
    setEmbedMessageId(key, sent.id);
    console.log(`✅ Message ${key} envoyé (${sent.id})`);
    return;
  }

  const existingMessage = await channel.messages.fetch(cfg.messageId).catch(() => null);

  if (!existingMessage) {
    const resent = await channel.send(payload);
    setEmbedMessageId(key, resent.id);
    console.log(`♻️ Message ${key} recréé (${resent.id})`);
    return;
  }

  await existingMessage.edit(payload);
  console.log(`🔄 Message ${key} mis à jour (${existingMessage.id})`);
}

export async function ensureAndUpdateEmbeds(client, env) {
  await ensureOrUpdateOne({
    client,
    key: "ARKADIA",
    channelId: env.EMBEDS_CHANNEL_ID,
    clanTag: `#${env.CLAN_ARKADIA}`,
    clanLink: env.CLAN_ARKADIA_LINK,
    token: env.COC_API_TOKEN
  });

  await ensureOrUpdateOne({
    client,
    key: "POLIS",
    channelId: env.EMBEDS_CHANNEL_ID,
    clanTag: `#${env.CLAN_POLIS}`,
    clanLink: env.CLAN_POLIS_LINK,
    token: env.COC_API_TOKEN
  });
}