import { getCurrentWar } from "../services/cocApi.js";
import { sendWarAttackFeedOnce, sendWarOverview } from "../services/warFeed.js";
import { loadWarState } from "../services/warStore.js";

const ACTIVE_WARS = new Map();
let warInterval = null;

function formatTag(tag) {
  return tag.startsWith("#") ? tag : `#${tag}`;
}

function parseCoCTime(timeStr) {
  if (!timeStr) return null;

  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.\d{3}Z$/.exec(timeStr);
  if (!match) return null;

  const [, y, mo, d, h, mi, s] = match;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return null;
  return Math.floor(date.getTime() / 1000);
}

function makeWarId(apiWar) {
  const clanTag = apiWar?.clan?.tag ?? "unknown";
  const oppTag = apiWar?.opponent?.tag ?? "unknown";
  const start = apiWar?.startTime ?? "";
  const end = apiWar?.endTime ?? "";

  return `${clanTag}-${oppTag}-${start}-${end}`;
}

function normalizeWar(apiWar) {
  const ourClan = apiWar.clan;
  const opponent = apiWar.opponent;

  const teamSize = apiWar.teamSize;
  const startUnix = parseCoCTime(apiWar.startTime);
  const endUnix = parseCoCTime(apiWar.endTime);
  const state = apiWar.state;
  const result = apiWar.result;
  const warId = makeWarId(apiWar);

  let stateText = "État inconnu";

  if (state === "preparation") {
    stateText = startUnix
      ? `Préparation – début du jour de combat <t:${startUnix}:R>`
      : "Préparation";
  } else if (state === "inWar") {
    stateText = endUnix
      ? `Jour de combat – fin dans <t:${endUnix}:R>`
      : "Jour de combat";
  } else if (state === "warEnded") {
    stateText = endUnix
      ? `Guerre terminée <t:${endUnix}:R>`
      : "Guerre terminée";
  } else if (state === "notInWar") {
    stateText = "Aucune guerre en cours";
  }

  const clanTH = {};
  const oppTH = {};

  for (const m of ourClan?.members ?? []) {
    const th = m.townhallLevel ?? m.townHallLevel ?? 0;
    clanTH[th] = (clanTH[th] || 0) + 1;
  }

  for (const m of opponent?.members ?? []) {
    const th = m.townhallLevel ?? m.townHallLevel ?? 0;
    oppTH[th] = (oppTH[th] || 0) + 1;
  }

  const overview = {
    warId,
    warName: `${ourClan?.name ?? "Clan"} (${ourClan?.tag ?? ""})`,
    stateText,
    teamSize,
    state,
    result,
    clan: {
      name: ourClan?.name,
      tag: ourClan?.tag,
      stars: ourClan?.stars,
      attacks: ourClan?.attacks,
      destruction: ourClan?.destructionPercentage,
      townHalls: clanTH
    },
    opponent: {
      name: opponent?.name,
      tag: opponent?.tag,
      stars: opponent?.stars,
      attacks: opponent?.attacks,
      destruction: opponent?.destructionPercentage,
      townHalls: oppTH
    }
  };

  const ourMembersByTag = new Map();
  const oppMembersByTag = new Map();

  for (const m of ourClan?.members ?? []) ourMembersByTag.set(m.tag, m);
  for (const m of opponent?.members ?? []) oppMembersByTag.set(m.tag, m);

  const attacks = [];

  for (const m of ourClan?.members ?? []) {
    const hitTotal = 2;
    const atkList = [...(m.attacks ?? [])].sort((a, b) => a.order - b.order);

    atkList.forEach((atk, idx) => {
      const def = oppMembersByTag.get(atk.defenderTag) || {};

      attacks.push({
        type: "attack",
        order: atk.order,
        stars: atk.stars,
        destruction: atk.destructionPercentage,
        attacker: {
          name: m.name,
          townHall: m.townhallLevel ?? m.townHallLevel,
          position: m.mapPosition,
          hitIndex: idx + 1,
          hitTotal,
          tag: m.tag
        },
        defender: {
          name: def.name ?? `Base ${atk.defenderTag}`,
          townHall: def.townhallLevel ?? def.townHallLevel,
          position: def.mapPosition,
          tag: def.tag
        },
        defenderTag: atk.defenderTag
      });
    });
  }

  for (const m of opponent?.members ?? []) {
    const hitTotal = 2;
    const atkList = [...(m.attacks ?? [])].sort((a, b) => a.order - b.order);

    atkList.forEach((atk, idx) => {
      const def = ourMembersByTag.get(atk.defenderTag) || {};

      attacks.push({
        type: "defense",
        order: atk.order,
        stars: atk.stars,
        destruction: atk.destructionPercentage,
        attacker: {
          name: m.name,
          townHall: m.townhallLevel ?? m.townHallLevel,
          position: m.mapPosition,
          hitIndex: idx + 1,
          hitTotal,
          tag: m.tag
        },
        defender: {
          name: def.name ?? `Base ${atk.defenderTag}`,
          townHall: def.townhallLevel ?? def.townHallLevel,
          position: def.mapPosition,
          tag: def.tag
        },
        defenderTag: atk.defenderTag
      });
    });
  }

  attacks.sort((a, b) => a.order - b.order);

  return { overview, attacks };
}

function makeAttackKey(a) {
  return `${a.attacker?.tag}-${a.defenderTag}-${a.order}`;
}

async function processOneClan(client, env, clanTag) {
  const channel = await client.channels.fetch(env.WAR_FEED_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    console.error("[WarLoop] Salon feed guerre introuvable.");
    return;
  }

  const apiWar = await getCurrentWar(formatTag(clanTag), env.COC_API_TOKEN).catch((err) => {
    console.error("[WarLoop] API error:", err);
    return null;
  });

  if (!apiWar || apiWar.state === "notInWar") {

    console.log(`[WarLoop] ${clanTag} : aucune guerre en cours`);

    const overview = {
        warId: `nowar-${clanTag}`,
        warName: `Aucune guerre – ${clanTag}`,
        stateText: "Aucune guerre en cours",
        teamSize: 0,
        state: "notInWar",
        result: null,
        clan: {
            name: clanTag,
            tag: clanTag,
            stars: 0,
            attacks: 0,
            destruction: 0,
            townHalls: {}
        },
        opponent: {
            name: "—",
            tag: "—",
            stars: 0,
            attacks: 0,
            destruction: 0,
            townHalls: {}
        }
    };

    await sendWarOverview(channel, overview, {
        createThread: false
    });

    return;
}

  const { overview, attacks } = normalizeWar(apiWar);
  const warId = overview.warId;

  if (!ACTIVE_WARS.has(warId)) {
    const persisted = loadWarState(warId);

    ACTIVE_WARS.set(warId, {
      warId,
      overviewMessageId: persisted.overviewMessageId ?? null,
      threadId: persisted.threadId ?? null,
      seenKeys: new Set(),
      bestPerBase: {}
    });
  }

  const runtimeState = ACTIVE_WARS.get(warId);

  const { message, thread } = await sendWarOverview(channel, overview, {
    createThread: !runtimeState.threadId
  });

  runtimeState.overviewMessageId = message?.id ?? runtimeState.overviewMessageId;
  runtimeState.threadId = thread?.id ?? runtimeState.threadId;

  console.log(
    `[WarLoop] ${overview.clan.name} vs ${overview.opponent.name} | ${overview.state} | overview refresh`
  );

  let feed = channel;

  if (runtimeState.threadId) {
    const th = await channel.threads.fetch(runtimeState.threadId).catch(() => null);
    if (th) {
      feed = th;
    }
  }

  for (const atk of attacks) {
    const key = makeAttackKey(atk);
    if (runtimeState.seenKeys.has(key)) continue;

    const prev = runtimeState.bestPerBase[atk.defenderTag] ?? 0;

    const res = await sendWarAttackFeedOnce(feed, overview, {
      ...atk,
      previousBestStars: prev
    });

    runtimeState.bestPerBase[atk.defenderTag] = Math.max(prev, atk.stars);
    runtimeState.seenKeys.add(key);

    if (res) {
      console.log(
        `[WarLoop] Nouvelle ${atk.type === "attack" ? "attaque" : "défense"} : ${atk.attacker.name} -> ${atk.defender.name} (${atk.stars}★ ${atk.destruction}%)`
      );
    }
  }
}

export async function startWarLoop(client, env) {
  const clanTags = [env.CLAN_ARKADIA, env.CLAN_POLIS].filter(Boolean);
  const ms = env.UPDATE_INTERVAL_MINUTES * 60 * 1000;

  if (warInterval) {
    clearInterval(warInterval);
    warInterval = null;
  }

  async function tick() {
    console.log(`[WarLoop] Tick ${new Date().toLocaleString("fr-FR")}`);

    for (const tag of clanTags) {
      try {
        await processOneClan(client, env, tag);
      } catch (error) {
        console.error(`[WarLoop] Erreur sur le clan ${tag}:`, error);
      }
    }
  }

  await tick();

  warInterval = setInterval(async () => {
    await tick();
  }, ms);

  console.log(`[WarLoop] Boucle lancée toutes les ${env.UPDATE_INTERVAL_MINUTES} minute(s)`);
}