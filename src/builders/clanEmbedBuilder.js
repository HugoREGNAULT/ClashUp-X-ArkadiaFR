import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder
} from "discord.js";

import { getClan, getMembers } from "../services/cocApi.js";
import { translateWarLeagueName } from "../constants/warLeagueTranslations.js";

const TH_EMOJIS = {
  18: "<:HDV_18:1449923786253013133>",
  17: "<:HDV_17:1449924430997487656>",
  16: "<:HDV_16:1449924611130134639>",
  15: "<:HDV_15:1449924718894383318>",
  14: "<:HDV_14:1449924830861463743>",
  13: "<:HDV_13:1449924948695974040>",
  12: "<:HDV_12:1449925050965692438>",
  11: "<:HDV_11:1449925143798485157>",
  "10-": "<:HDV_10:1449925329412952194>"
};

const EMOJI_CLANWAR = "<:ClanWar:1449926758018318427>";
const EMOJI_CAPITAL = "<:CapitalRessources:1450069593342218240>";

function formatTag(tagWithHash) {
  return tagWithHash.startsWith("#") ? tagWithHash : `#${tagWithHash}`;
}

function formatParisNow() {
  const s = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());

  return s.replace(",", "");
}

function countTH(members) {
  const counts = {
    18: 0,
    17: 0,
    16: 0,
    15: 0,
    14: 0,
    13: 0,
    12: 0,
    11: 0,
    "10-": 0
  };

  for (const m of members) {
    const th = Number(m.townHallLevel ?? 0);

    if (th >= 18) counts[18]++;
    else if (th === 17) counts[17]++;
    else if (th === 16) counts[16]++;
    else if (th === 15) counts[15]++;
    else if (th === 14) counts[14]++;
    else if (th === 13) counts[13]++;
    else if (th === 12) counts[12]++;
    else if (th === 11) counts[11]++;
    else counts["10-"]++;
  }

  return counts;
}

function formatTHLine(counts) {
  const order = [18, 17, 16, 15, 14, 13, 12, 11, "10-"];
  return order.map((k) => `**${counts[k]}** ${TH_EMOJIS[k]}`).join("  ");
}

export async function buildClanV2Message({ clanTag, clanLink, token }) {

  const tag = formatTag(clanTag);

  const [clan, members] = await Promise.all([
    getClan(tag, token),
    getMembers(tag, token)
  ]);

  const thCounts = countTH(members);

  // ✅ stats guerre correctes
  const wins = Number(clan.warWins ?? 0);
  const losses = Number(clan.warLosses ?? 0);
  const ties = Number(clan.warTies ?? 0);

  const capitalHall = clan?.clanCapital?.capitalHallLevel ?? null;

  const badgeUrl =
    clan?.badgeUrls?.large ||
    clan?.badgeUrls?.medium ||
    clan?.badgeUrls?.small ||
    null;

  const headerBlock = [
    `## ${clan.name}`,
    `⎬**Identifiant** : \`${tag}\``,
    `⎬**Niveau du clan** : **${clan.clanLevel ?? "?"}**`,
    ``,
    `👥〡**Membres** : **${clan.members ?? members.length ?? "?"}/50**`,
    ` ➥ ${formatTHLine(thCounts)}`
  ].join("\n");

  const middleBlock = [
    `${EMOJI_CLANWAR} ⎬**Ligue de clan** : **${translateWarLeagueName(clan.warLeague?.name)}**`,
    `${EMOJI_CAPITAL} ⎬**Niveau Capitale** : **${capitalHall ?? "N/A"}**`,
    ``,
    `⎬**Stats Guerre** : **${wins}V / ${losses}D / ${ties}E**`
  ].join("\n");

  const footer = `*Dernière mise à jour : ${formatParisNow()}*`;

  const headerSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(headerBlock)
    );

  if (badgeUrl) {
    headerSection.setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(badgeUrl)
        .setDescription(`Blason du clan ${clan.name}`)
    );
  }

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel("Rejoindre le clan")
      .setURL(clanLink)
  );

  const separator = () =>
    new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Large);

  const container = new ContainerBuilder()
    .addSectionComponents(headerSection)
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(middleBlock)
    )
    .addSeparatorComponents(separator())
    .addActionRowComponents(buttonRow)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(footer)
    );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2
  };
}