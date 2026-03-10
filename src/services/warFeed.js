import {
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder
} from "discord.js";

import { getTownHallEmoji } from "../utils/emojiUtil.js";
import { readJson } from "../utils/jsonStore.js";
import { loadWarState, saveWarState } from "./warStore.js";

const EMOJI_FIGHT = "<a:WarAttack:1443704676427108422>";

const EMOJI_US_NEW = "<:1_:1443660833195298877>";
const EMOJI_US_NO_NEW = "<:2_:1443660760583508115>";
const EMOJI_NO_STAR = "<:3_:1443660808424001626>";
const EMOJI_ENEMY_GAIN = "<:4_:1443660782964314162>";
const EMOJI_ENEMY_OLD = "<:5_:1443660857304420464>";

let playersCache = null;
let paramsCache = null;

function loadPlayers() {
  if (!playersCache) {
    const data = readJson("players.json", []);
    playersCache = Array.isArray(data) ? data : [];
  }
  return playersCache;
}

function loadParams() {
  if (!paramsCache) {
    const data = readJson("params.json", []);
    paramsCache = Array.isArray(data) ? data : [];
  }
  return paramsCache;
}

function getDiscordIdFromTag(tag) {
  if (!tag) return null;
  const players = loadPlayers();
  const found = players.find((p) => p.cocTag === tag);
  return found?.discordId ?? null;
}

function isWarMentionEnabled(discordId) {
  if (!discordId) return false;
  const params = loadParams();
  const found = params.find((p) => p.discordId === discordId);
  return Boolean(found?.mentionWarFeed);
}

export function getWarKey(war) {
  if (war.id) return String(war.id);
  if (war.warId) return String(war.warId);

  const clanTag = war.clan?.tag ?? "unknownClan";
  const oppTag = war.opponent?.tag ?? "unknownOpponent";

  return `${clanTag}_${oppTag}`;
}

function getWarAccentColor(war) {
  const state = String(war.state || "").toLowerCase();
  const result = String(war.result || "").toLowerCase();

  const COLOR_DEFAULT = 0xa8dcff;
  const COLOR_PREPARATION = 0xfbbf24;
  const COLOR_IN_WAR = 0x3b82f6;
  const COLOR_WIN = 0x22c55e;
  const COLOR_LOSE = 0x991b1b;
  const COLOR_TIE = 0xa855f7;

  if (state === "preparation") return COLOR_PREPARATION;
  if (state === "inwar") return COLOR_IN_WAR;

  if (state === "warended" || state === "ended" || state === "end") {
    if (result === "win" || result === "won") return COLOR_WIN;
    if (result === "lose" || result === "loss" || result === "lost") return COLOR_LOSE;
    if (result === "tie" || result === "draw") return COLOR_TIE;
  }

  return COLOR_DEFAULT;
}

function formatPercent(value) {
  if (value == null) return "—";
  return `${Number(value).toFixed(2)}%`;
}

function formatPercentShort(value) {
  if (value == null) return "—";
  return `${Math.round(Number(value))}%`;
}

function buildTownHallLine(title, thMap) {
  const entries = Object.entries(thMap || {})
    .filter(([, count]) => Number(count) > 0)
    .sort((a, b) => Number(b[0]) - Number(a[0]));

  if (!entries.length) {
    return `**${title}**\n—`;
  }

  const parts = entries.map(([level, count]) => {
    const emoji = getTownHallEmoji(level);
    return `**${count}** ${emoji}`;
  });

  return `**${title}**\n${parts.join("   ")}`;
}

export function buildWarOverviewContainer(war) {
  const now = Math.floor(Date.now() / 1000);
  const maxAttacks = (war.teamSize || 0) * 2;
  const maxStars = (war.teamSize || 0) * 3;

  const header = new TextDisplayBuilder().setContent(`## ${war.warName}`);

  const vsBlock = new TextDisplayBuilder().setContent(
    [
      "**Ennemi**",
      `${war.opponent.name} (\`${war.opponent.tag}\`)`
    ].join("\n")
  );

  const stateBlock = new TextDisplayBuilder().setContent(
    [
      "**Status**",
      war.stateText
    ].join("\n")
  );

  const teamBlock = new TextDisplayBuilder().setContent(
    [
      "**Effectifs**",
      `${war.teamSize} vs ${war.teamSize}`
    ].join("\n")
  );

  const c = war.clan;
  const o = war.opponent;

  const clanStars = String(c.stars ?? 0).padStart(2, " ");
  const clanHits = `${c.attacks ?? 0}/${maxAttacks}`.padStart(3, " ");
  const clanPct = formatPercent(c.destruction).padStart(3, " ");

  const enemyStars = String(o.stars ?? 0).padStart(2, " ");
  const enemyHits = `${o.attacks ?? 0}/${maxAttacks}`.padStart(3, " ");
  const enemyPct = formatPercent(o.destruction).padStart(3, " ");

  const statsBlock = new TextDisplayBuilder().setContent(
    [
      "**Statistiques**",
      `Clan       : ${EMOJI_US_NEW} \`${clanStars}/${maxStars}\`   ${EMOJI_FIGHT} \`${clanHits}\`  \`${clanPct}\``,
      `Ennemi  : ${EMOJI_US_NEW} \`${enemyStars}/${maxStars}\`   ${EMOJI_FIGHT} \`${enemyHits}\`  \`${enemyPct}\``
    ].join("\n")
  );

  const thClanLine = buildTownHallLine("HDVs – Clan", war.clan.townHalls);
  const thOppLine = buildTownHallLine("HDVs – Ennemi", war.opponent.townHalls);

  const thBlock = new TextDisplayBuilder().setContent(
    `${thClanLine}\n\n${thOppLine}`
  );

  const footerBlock = new TextDisplayBuilder().setContent(
    `-# Dernière actualisation : <t:${now}:R>`
  );

  return new ContainerBuilder()
    .setAccentColor(getWarAccentColor(war))
    .addTextDisplayComponents(header)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(vsBlock)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(stateBlock)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(teamBlock)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(statsBlock)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(thBlock)
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(footerBlock);
}

export async function sendWarOverview(channel, warData, options = {}) {
  const { createThread = true, threadName } = options;

  const warKey = getWarKey(warData);
  const warState = loadWarState(warKey);

  warState.teamSize = warData.teamSize;

  const container = buildWarOverviewContainer(warData);

  let message = null;
  let thread = null;

  if (warState.overviewMessageId) {
    try {
      message = await channel.messages.fetch(warState.overviewMessageId);
      await message.edit({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch {
      message = null;
    }
  }

  if (!message) {
    message = await channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    });
  }

  if (warState.threadId && channel.threads) {
    try {
      thread = await channel.threads.fetch(warState.threadId);
    } catch {
      thread = null;
    }
  }

  if (!thread && createThread && message.startThread) {
    const name =
      threadName ||
      `GDC – ${warData.clan?.name ?? "Clan"} vs ${warData.opponent?.name ?? "Ennemi"}`;

    thread = await message.startThread({
      name: name.slice(0, 100),
      autoArchiveDuration: 1440
    });
  }

  warState.overviewMessageId = message.id;
  warState.threadId = thread?.id ?? warState.threadId ?? null;
  saveWarState(warKey, warState);

  return { message, thread, warKey, warState };
}

function buildScoreBar(type, stars, previousBestStars = 0) {
  let s = Number(stars) || 0;
  let p = Number(previousBestStars) || 0;

  s = Math.max(0, Math.min(3, s));
  p = Math.max(0, Math.min(3, p));

  if (s === 0) {
    return EMOJI_NO_STAR + EMOJI_NO_STAR + EMOJI_NO_STAR;
  }

  const icons = [];

  if (type === "attack") {
    if (s > p) {
      for (let i = 1; i <= 3; i++) {
        if (i <= s) icons.push(EMOJI_US_NEW);
        else icons.push(EMOJI_NO_STAR);
      }
    } else if (s === p && s === 3) {
      for (let i = 1; i <= 3; i++) {
        icons.push(EMOJI_US_NO_NEW);
      }
    } else {
      for (let i = 1; i <= 3; i++) {
        if (i <= s) icons.push(EMOJI_US_NO_NEW);
        else icons.push(EMOJI_NO_STAR);
      }
    }
  } else {
    if (s > p) {
      for (let i = 1; i <= 3; i++) {
        if (i <= p) icons.push(EMOJI_ENEMY_OLD);
        else if (i <= s) icons.push(EMOJI_ENEMY_GAIN);
        else icons.push(EMOJI_NO_STAR);
      }
    } else if (s === p && s === 3) {
      for (let i = 1; i <= 3; i++) {
        icons.push(EMOJI_ENEMY_OLD);
      }
    } else {
      for (let i = 1; i <= 3; i++) {
        if (i <= s) icons.push(EMOJI_ENEMY_OLD);
        else icons.push(EMOJI_NO_STAR);
      }
    }
  }

  return icons.join("");
}

export function buildWarAttackLine(attack) {
  const {
    type = "attack",
    attacker,
    defender,
    stars,
    destruction,
    previousBestStars = 0
  } = attack;

  const atkTh = getTownHallEmoji(attacker.townHall);
  const defTh = getTownHallEmoji(defender.townHall);

  const left = `${atkTh} **${attacker.position}. ${attacker.name} (${attacker.hitIndex}/${attacker.hitTotal})**`;
  const right = `**${defender.position}. ${defender.name}** ${defTh}`;

  const scoreBar = buildScoreBar(type, stars, previousBestStars);
  const pct = formatPercentShort(destruction);

  let line = `${left} ${EMOJI_FIGHT} ${right} → ${scoreBar} **${pct}**`;

  let discordId = null;

  if (type === "attack" && attacker.tag) {
    discordId = getDiscordIdFromTag(attacker.tag);
  } else if (type === "defense" && defender.tag) {
    discordId = getDiscordIdFromTag(defender.tag);
  }

  if (discordId && isWarMentionEnabled(discordId)) {
    line += ` || <@${discordId}> ||`;
  }

  return line;
}

function buildAttackEventKey(attack) {
  const type = attack.type || "attack";
  const atkTagOrPos = attack.attacker?.tag || `pos${attack.attacker?.position ?? "?"}`;
  const defTagOrPos = attack.defender?.tag || `pos${attack.defender?.position ?? "?"}`;
  const hitIndex = attack.attacker?.hitIndex ?? 1;

  return `${type}:${atkTagOrPos}:${defTagOrPos}:${hitIndex}`;
}

export async function sendWarAttackFeedOnce(channel, warData, attackData) {
  const warKey = getWarKey(warData);
  const eventKey = buildAttackEventKey(attackData);

  const warState = loadWarState(warKey);

  if (warState.sentEvents.includes(eventKey)) {
    return null;
  }

  const content = buildWarAttackLine(attackData);
  const message = await channel.send({ content });

  const updatedState = {
    ...warState,
    sentEvents: [...warState.sentEvents, eventKey]
  };

  saveWarState(warKey, updatedState);

  return { message, warKey, warState: updatedState };
}