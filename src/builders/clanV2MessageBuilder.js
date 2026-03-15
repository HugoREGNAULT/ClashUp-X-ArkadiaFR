import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    EmbedBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    StringSelectMenuBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder
  } from "discord.js";
  
  import {
    getClan,
    getMembers,
    getClanWarLog,
    getCapitalRaidSeasons
  } from "../services/cocApi.js";
  import { translateWarLeagueName } from "../constants/warLeagueTranslations.js";
  import { getTownHallEmoji } from "../utils/emojiUtil.js";
  
  const MEMBERS_PER_PAGE = 25;
  const STAR_EMOJI = "<:_2:1465007689422737562>";
  const ATTACK_EMOJI = "<a:WarAttack:1443704676427108422>";
  
  const CAPI_RAID_EMOJI = "<:CAPI_Raid:1482767270714277898>";
  const CAPI_HOUSE_EMOJI = "<:CAPI_House:1482766565219893268>";
  const CAPI_SWORD_EMOJI = "<:CAPI_Sword:1482767834827194368>";
  const CAPI_PARTICIPANTS_EMOJI = "<:CAPI_Participants:1482768619489329327>";
  const CAPI_LOOT_EMOJI = "<:CAPI_Loot:1482768421299949618>";
  
  const TH_MENU_EMOJIS = {
    18: { id: "1449923786253013133", name: "HDV_18" },
    17: { id: "1449924430997487656", name: "HDV_17" },
    16: { id: "1449924611130134639", name: "HDV_16" },
    15: { id: "1449924718894383318", name: "HDV_15" },
    14: { id: "1449924830861463743", name: "HDV_14" },
    13: { id: "1449924948695974040", name: "HDV_13" },
    12: { id: "1449925050965692438", name: "HDV_12" },
    11: { id: "1449925143798485157", name: "HDV_11" },
    "10-": { id: "1449925329412952194", name: "HDV_10" }
  };
  
  const WAR_LEAGUE_EMOJIS = {
    "Champion League I": "<:CWL_C1:1482701225832087594>",
    "Champion League II": "<:CWL_C2:1482701267514953759>",
    "Champion League III": "<:CWL_C3:1482701300394360892>",
    "Crystal League I": "<:CWL_Cr1:1482701344044220448>",
    "Crystal League II": "<:CWL_Cr2:1482701379763044422>",
    "Crystal League III": "<:CWL_Cr3:1482701419227119778>",
    "Gold League I": "<:CWL_G1:1482701467172212849>",
    "Gold League II": "<:CWL_G2:1482701500714320095>",
    "Gold League III": "<:CWL_G3:1482701540367274096>",
    "Master League I": "<:CWL_M1:1482701586831769704>",
    "Master League II": "<:CWL_M2:1482701631433998498>",
    "Master League III": "<:CWL_M3:1482701666938781817>"
  };
  
  const ROLE_TRANSLATIONS = {
    leader: "Chef",
    coLeader: "Chef adjoint",
    admin: "Aîné",
    member: "Membre"
  };
  
  const TYPE_TRANSLATIONS = {
    open: "Ouvert",
    inviteOnly: "Sur invitation",
    closed: "Fermé"
  };
  
  const CAPITAL_LEAGUE_TRANSLATIONS = {
    Unranked: "Non classé",
    "Wood League III": "Ligue Bois III",
    "Wood League II": "Ligue Bois II",
    "Wood League I": "Ligue Bois I",
    "Bronze League III": "Ligue Bronze III",
    "Bronze League II": "Ligue Bronze II",
    "Bronze League I": "Ligue Bronze I",
    "Silver League III": "Ligue Argent III",
    "Silver League II": "Ligue Argent II",
    "Silver League I": "Ligue Argent I",
    "Gold League III": "Ligue Or III",
    "Gold League II": "Ligue Or II",
    "Gold League I": "Ligue Or I",
    "Crystal League III": "Ligue Cristal III",
    "Crystal League II": "Ligue Cristal II",
    "Crystal League I": "Ligue Cristal I",
    "Master League III": "Ligue Maître III",
    "Master League II": "Ligue Maître II",
    "Master League I": "Ligue Maître I",
    "Champion League III": "Ligue Champion III",
    "Champion League II": "Ligue Champion II",
    "Champion League I": "Ligue Champion I",
    "Titan League III": "Ligue Titan III",
    "Titan League II": "Ligue Titan II",
    "Titan League I": "Ligue Titan I",
    "Legend League": "Ligue Légende"
  };
  
  function formatNumber(value) {
    return new Intl.NumberFormat("fr-FR").format(Number(value ?? 0));
  }
  
  function formatCompactLoot(value) {
    const num = Number(value ?? 0);
  
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
    }
  
    if (num >= 1_000) {
      return `${Math.round(num / 1_000)}k`;
    }
  
    return String(num);
  }
  
  function formatLastUpdated() {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
      .format(new Date())
      .replace(",", "");
  }
  
  function translateRole(role) {
    return ROLE_TRANSLATIONS[role] ?? role ?? "Inconnu";
  }
  
  function translateType(type) {
    return TYPE_TRANSLATIONS[type] ?? type ?? "Inconnu";
  }
  
  function translateCapitalLeagueName(apiName) {
    if (!apiName) return "Non classé";
    return CAPITAL_LEAGUE_TRANSLATIONS[apiName] ?? apiName;
  }
  
  function getWarLeagueDisplay(apiName) {
    const emoji = WAR_LEAGUE_EMOJIS[apiName] ?? "❌";
    const translated = translateWarLeagueName(apiName);
    return `${emoji} **\`${translated}\`**`;
  }
  
  function getSafeDescription(text) {
    const value = String(text ?? "").trim();
    return value.length ? value : "Aucune description.";
  }
  
  function getBadgeUrl(clan) {
    return clan?.badgeUrls?.large || clan?.badgeUrls?.medium || clan?.badgeUrls?.small || null;
  }
  
  function normalizeMembers(clan, members) {
    if (Array.isArray(members) && members.length > 0) return members;
    if (Array.isArray(clan?.memberList) && clan.memberList.length > 0) return clan.memberList;
    return [];
  }
  
  function normalizeView(view) {
    return ["overview", "war", "capital"].includes(view) ? view : "overview";
  }
  
  function clampMemberPage(memberPage, totalMembers) {
    const maxPage = Math.max(0, Math.ceil(totalMembers / MEMBERS_PER_PAGE) - 1);
    return Math.min(Math.max(Number(memberPage) || 0, 0), maxPage);
  }
  
  function getMenuEmoji(level) {
    const th = Number(level ?? 0);
    if (th >= 18) return TH_MENU_EMOJIS[18];
    if (th === 17) return TH_MENU_EMOJIS[17];
    if (th === 16) return TH_MENU_EMOJIS[16];
    if (th === 15) return TH_MENU_EMOJIS[15];
    if (th === 14) return TH_MENU_EMOJIS[14];
    if (th === 13) return TH_MENU_EMOJIS[13];
    if (th === 12) return TH_MENU_EMOJIS[12];
    if (th === 11) return TH_MENU_EMOJIS[11];
    return TH_MENU_EMOJIS["10-"];
  }
  
  function formatRequiredTownHall(level) {
    const th = Number(level ?? 0);
  
    if (!th || th <= 0) {
      return "» **HDV requis** : Aucun";
    }
  
    return `» **HDV requis** : ${getTownHallEmoji(th)} (**HDV ${th}**)`;
  }
  
  function getFlagEmoji(countryCode) {
    const code = String(countryCode ?? "").trim().toUpperCase();
  
    if (!/^[A-Z]{2}$/.test(code)) {
      return "🏳️";
    }
  
    return String.fromCodePoint(
      ...[...code].map((char) => 127397 + char.charCodeAt(0))
    );
  }
  
  function formatCountry(clan) {
    const name = clan?.location?.name ?? "Inconnu";
    const countryCode = clan?.location?.countryCode;
    const flag = getFlagEmoji(countryCode);
  
    return `${flag} (${name})`;
  }
  
  function computeTownHallDistribution(members) {
    const counts = { 18: 0, 17: 0, 16: 0, 15: 0, 14: 0, 13: 0, 12: 0, 11: 0, "10-": 0 };
  
    for (const member of members) {
      const th = Number(member?.townHallLevel ?? 0);
      if (th >= 18) counts[18] += 1;
      else if (th === 17) counts[17] += 1;
      else if (th === 16) counts[16] += 1;
      else if (th === 15) counts[15] += 1;
      else if (th === 14) counts[14] += 1;
      else if (th === 13) counts[13] += 1;
      else if (th === 12) counts[12] += 1;
      else if (th === 11) counts[11] += 1;
      else counts["10-"] += 1;
    }
  
    return counts;
  }
  
  function formatTownHallDistribution(members, clanMemberCount) {
    const counts = computeTownHallDistribution(members);
    const totalMembers = Number(clanMemberCount ?? members.length ?? 0);
  
    const order = [18, 17, 16, 15, 14, 13, 12, 11, "10-"];
  
    const thParts = order
      .filter((th) => Number(counts[th] ?? 0) > 0)
      .map((th) => `**${counts[th]}** ${getTownHallEmoji(th === "10-" ? 10 : th)}`);
  
    return [
      `» **\`${totalMembers}\`** membres.`,
      ` ➥ ${thParts.join("  ")}`
    ].join("\n");
  }
  
  function sortMembersByTrophies(members) {
    return [...members].sort((a, b) => {
      const trophyDiff = Number(b?.trophies ?? 0) - Number(a?.trophies ?? 0);
      if (trophyDiff !== 0) return trophyDiff;
      return Number(b?.townHallLevel ?? 0) - Number(a?.townHallLevel ?? 0);
    });
  }
  
  const CAPITAL_DISTRICT_TRANSLATIONS = {
    "Capital Peak": "Sommet de la capitale",
    "Barbarian Camp": "Camp barbare",
    "Wizard Valley": "Vallée des sorciers",
    "Balloon Lagoon": "Lagon des ballons",
    "Builder's Workshop": "Atelier du bâtisseur",
    "Dragon Cliffs": "Falaises du dragon",
    "Golem Quarry": "Carrière de golems",
    "Skeleton Park": "Parc des squelettes",
    "Goblin Mines": "Mines des gobelins",
  };

  function buildCapitalTableHeader() {
    return [
      `${formatRaidMetric("📆", 12)}`,
      `         ${CAPI_RAID_EMOJI}`,
      `                    ${CAPI_HOUSE_EMOJI}`,
      `                     ${CAPI_SWORD_EMOJI}`,
      `                  ${CAPI_PARTICIPANTS_EMOJI}`,
      `                       ${CAPI_LOOT_EMOJI}`
    ].join("");
  }

  function translateCapitalDistrictName(name) {
    return CAPITAL_DISTRICT_TRANSLATIONS[name] ?? name ?? "District inconnu";
  }
  
  function formatDistricts(clan) {
    const districts = clan?.clanCapital?.districts;
    if (!Array.isArray(districts) || districts.length === 0) {
      return "Aucune donnée.";
    }
  
    return districts
      .map((district) => {
        const translatedName = translateCapitalDistrictName(district?.name);
        const level = district?.districtHallLevel ?? "?";
        return `• **${translatedName}** lvl. ${level}`;
      })
      .join("\n");
  }
  
  function getClanGameLink(clanTag) {
    const cleanTag = String(clanTag ?? "").replace("#", "%23");
    return `https://link.clashofclans.com/fr?action=OpenClanProfile&tag=${cleanTag}`;
  }
  
  function getWarResultLabel(entry) {
    const result = String(entry?.result ?? "").toLowerCase();
  
    if (result === "win") return "✅ Victoire";
    if (result === "lose") return "❌ Défaite";
    if (result === "tie") return "🤝 Égalité";
  
    const clanStars = Number(entry?.clan?.stars ?? 0);
    const enemyStars = Number(entry?.opponent?.stars ?? 0);
    const clanDestruction = Number(entry?.clan?.destructionPercentage ?? 0);
    const enemyDestruction = Number(entry?.opponent?.destructionPercentage ?? 0);
  
    if (clanStars > enemyStars) return "✅ Victoire";
    if (clanStars < enemyStars) return "❌ Défaite";
    if (clanDestruction > enemyDestruction) return "✅ Victoire";
    if (clanDestruction < enemyDestruction) return "❌ Défaite";
  
    return "🤝 Égalité";
  }
  
  function formatDestruction(value) {
    return `${Number(value ?? 0).toFixed(2)}%`;
  }
  
  function formatWarMetric(value) {
    const text = String(value ?? "");
    const width = 12;
    const totalPadding = Math.max(0, width - text.length);
    const left = Math.floor(totalPadding / 2);
    const right = totalPadding - left;
  
    return `\`${" ".repeat(left)}${text}${" ".repeat(right)}\``;
  }
  
  function formatWarLogEntries(warLog, clanName) {
    if (!Array.isArray(warLog) || warLog.length === 0) {
      return "Aucune donnée de guerre disponible.";
    }
  
    return warLog.slice(0, 3).map((entry) => {
      const enemyName = entry?.opponent?.name ?? "Clan adverse inconnu";
      const enemyTag = entry?.opponent?.tag ?? "?";
  
      const clanStars = entry?.clan?.stars ?? 0;
      const enemyStars = entry?.opponent?.stars ?? 0;
  
      const clanDestruction = formatDestruction(entry?.clan?.destructionPercentage ?? 0);
      const enemyDestruction = formatDestruction(entry?.opponent?.destructionPercentage ?? 0);
  
      return [
        `» **${clanName ?? "Clan"}** vs **${enemyName}** (\`${enemyTag}\`) :`,
        ` ➥ ${getWarResultLabel(entry)}`,
        `${formatWarMetric(clanStars)} ${STAR_EMOJI} ${formatWarMetric(enemyStars)}`,
        `${formatWarMetric(clanDestruction)} ${ATTACK_EMOJI} ${formatWarMetric(enemyDestruction)}`
      ].join("\n");
    }).join("\n\n");
  }
  
  function parseCocTimestamp(value) {
    const raw = String(value ?? "").trim();
  
    // Format CoC typique : 20240216T070000.000Z
    const match = raw.match(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/
    );
  
    if (!match) return null;
  
    const [, year, month, day, hour, minute, second, ms] = match;
  
    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        Number(ms)
      )
    );
  }
  
  function getIsoWeekNumber(date) {
    const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
  }
  
  function getWeekLabel(dateString) {
    const date = parseCocTimestamp(dateString);
  
    if (!date || Number.isNaN(date.getTime())) {
      return "Sem ??.";
    }
  
    const weekNo = getIsoWeekNumber(date);
    return `Sem ${String(weekNo).padStart(2, "0")}.`;
  }
  
  function sumRaidAttacks(attackLog) {
    if (!Array.isArray(attackLog)) return 0;
    return attackLog.reduce((sum, clanEntry) => {
      const attacks = Array.isArray(clanEntry?.districts)
        ? clanEntry.districts.reduce((acc, d) => acc + Number(d?.attackCount ?? 0), 0)
        : 0;
      return sum + attacks;
    }, 0);
  }
  
  function countDestroyedDistricts(attackLog) {
    if (!Array.isArray(attackLog)) return 0;
    return attackLog.reduce((sum, clanEntry) => {
      const destroyed = Array.isArray(clanEntry?.districts)
        ? clanEntry.districts.filter((d) => Number(d?.destructionPercent ?? 0) >= 100).length
        : 0;
      return sum + destroyed;
    }, 0);
  }
  
  function countCompletedRaids(attackLog) {
    if (!Array.isArray(attackLog)) return 0;
    return attackLog.length;
  }
  
  function formatRaidMetric(value, width = 10) {
    const text = String(value ?? "");
    const totalPadding = Math.max(0, width - text.length);
    const left = Math.floor(totalPadding / 2);
    const right = totalPadding - left;
  
    return `\`${" ".repeat(left)}${text}${" ".repeat(right)}\``;
  }

  function countUniqueRaidParticipants(season) {
    if (Array.isArray(season?.members)) {
      return season.members.length;
    }
  
    return Number(season?.members ?? 0);
  }

  function formatCapitalWeekendTable(raidSeasons) {
    if (!Array.isArray(raidSeasons) || raidSeasons.length === 0) {
      return "Aucune donnée de week-end de capitale disponible.";
    }
  
    const rows = raidSeasons.slice(0, 3).map((season) => {
      const week = getWeekLabel(season?.startTime);
      const raidsCompleted = countCompletedRaids(season?.attackLog);
      const destroyedDistricts = countDestroyedDistricts(season?.attackLog);
      const totalAttacks = sumRaidAttacks(season?.attackLog);
      const participants = countUniqueRaidParticipants(season);
      const loot = formatCompactLoot(season?.capitalTotalLoot ?? 0);
  
      return [
        formatRaidMetric(week, 12),
        formatRaidMetric(raidsCompleted, 9),
        formatRaidMetric(destroyedDistricts, 10),
        formatRaidMetric(totalAttacks, 10),
        formatRaidMetric(participants, 10),
        formatRaidMetric(loot, 12)
      ].join(" ");
    });
  
    return [buildCapitalTableHeader(), ...rows].join("\n");
  }
  
  function formatCapitalLegend() {
    return `-# ${CAPI_RAID_EMOJI} : Raids complétés. ${CAPI_HOUSE_EMOJI} : Districts détruits. ${CAPI_SWORD_EMOJI} : Attaques totales. ${CAPI_PARTICIPANTS_EMOJI} : Nombre de participants uniques. ${CAPI_LOOT_EMOJI} : Butin de la capitale.`;
  }
  
  function buildNavButtons(clanTag, activeView, memberPage = 0) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`clan_view|overview|${clanTag}|${memberPage}`)
        .setLabel("Aperçu")
        .setStyle(activeView === "overview" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`clan_view|war|${clanTag}|${memberPage}`)
        .setLabel("Guerre")
        .setStyle(activeView === "war" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`clan_view|capital|${clanTag}|${memberPage}`)
        .setLabel("Capitale")
        .setStyle(activeView === "capital" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel("Voir en jeu")
        .setStyle(ButtonStyle.Link)
        .setURL(getClanGameLink(clanTag))
    );
  }
  
  function buildMemberPageButtons(clanTag, activeView, memberPage, totalPages) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`clan_member_page|${activeView}|${clanTag}|${memberPage - 1}`)
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(memberPage <= 0),
      new ButtonBuilder()
        .setCustomId(`clan_noop|${activeView}|${clanTag}|${memberPage}`)
        .setLabel(`Membres ${memberPage + 1}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`clan_member_page|${activeView}|${clanTag}|${memberPage + 1}`)
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(memberPage >= totalPages - 1)
    );
  }
  
  function buildMemberSelectRow(clanTag, members, memberPage) {
    const start = memberPage * MEMBERS_PER_PAGE;
    const pageMembers = members.slice(start, start + MEMBERS_PER_PAGE);
  
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`clan_member_select|${clanTag}|${memberPage}`)
      .setPlaceholder("Choisir un membre à afficher en éphémère")
      .addOptions(
        pageMembers.map((member) => {
          const trophies = formatNumber(member?.trophies ?? 0);
          const name = String(member?.name ?? "Inconnu").slice(0, 45);
          const role = translateRole(member?.role);
  
          return {
            label: `${name} - ${trophies} trophées`.slice(0, 100),
            description: role.slice(0, 100),
            value: String(member?.tag ?? "unknown"),
            emoji: getMenuEmoji(member?.townHallLevel ?? 10)
          };
        })
      );
  
    return new ActionRowBuilder().addComponents(menu);
  }
  
  function makeTextDisplay(content) {
    return new TextDisplayBuilder().setContent(content);
  }
  
  function makeSeparator() {
    return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);
  }
  
  async function fetchClanContext(clanTag, token) {
    const clan = await getClan(clanTag, token);
    if (!clan) throw new Error("CLAN_NOT_FOUND");
  
    const fetchedMembers = await getMembers(clanTag, token);
    const members = normalizeMembers(clan, fetchedMembers);
  
    return { clan, members };
  }
  
  function buildOverviewContainer(clan, members) {
    const memberCount = Number(clan?.members ?? members.length ?? 0);
  
    const headerText = [
      `## ${clan?.name ?? "Clan inconnu"}`,
      `> ${getSafeDescription(clan?.description)}`,
      "",
      `🏷️ **Tag** : \`${clan?.tag ?? "?"}\``
    ].join("\n");
  
    const overviewText = [
      `» **LDC/CWL** : ${getWarLeagueDisplay(clan?.warLeague?.name ?? null)}`,
      `» **Stats GDC** :`,
      ` ➥ \`${clan?.warWins ?? 0}\` gagnées • \`${clan?.warLosses ?? 0}\` perdues • \`${clan?.warTies ?? 0}\` égalités`,
      `» **Hôtel de capitale** : \`${clan?.clanCapital?.capitalHallLevel ?? "N/A"}\``,
      `» **Ligue capitale** : \`${translateCapitalLeagueName(clan?.capitalLeague?.name ?? null)}\``
    ].join("\n");
  
    const miscText = [
      `» **Pays** : ${formatCountry(clan)}`,
      `» **Langue** : ${clan?.chatLanguage?.name ?? "Inconnue"}`,
      `» **Type** : ${translateType(clan?.type)}`
    ].join("\n");
  
    const requirementText = [
      `» **Trophées requis** : **${formatNumber(clan?.requiredTrophies ?? 0)} 🏆**`,
      `» **Trophées BB requis** : **${formatNumber(clan?.requiredBuilderBaseTrophies ?? 0)} 🏆**`,
      formatRequiredTownHall(clan?.requiredTownhallLevel)
    ].join("\n");
  
    const container = new ContainerBuilder();
    const headerSection = new SectionBuilder().addTextDisplayComponents(makeTextDisplay(headerText));
    const badgeUrl = getBadgeUrl(clan);
  
    if (badgeUrl) {
      headerSection.setThumbnailAccessory(new ThumbnailBuilder().setURL(badgeUrl));
    }
  
    container
      .addSectionComponents(headerSection)
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(overviewText))
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(formatTownHallDistribution(members, memberCount)))
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(miscText))
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(requirementText))
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(`-# Mis à jour le ${formatLastUpdated()} (heure de Paris)`));
  
    return container;
  }
  
  function buildWarContainer(clan, members, warLog) {
    const totalWars = Number(clan?.warWins ?? 0) + Number(clan?.warLosses ?? 0) + Number(clan?.warTies ?? 0);
    const winRate = totalWars > 0 ? ((Number(clan?.warWins ?? 0) / totalWars) * 100).toFixed(1) : "0.0";
  
    const headerText = [
      `## ${clan?.name ?? "Clan inconnu"} — Vue Guerre`,
      `> ${getSafeDescription(clan?.description)}`,
      "",
      `🏷️ **Tag** : \`${clan?.tag ?? "?"}\``
    ].join("\n");
  
    const overviewText = [
      `» **LDC/CWL** : ${getWarLeagueDisplay(clan?.warLeague?.name ?? null)}`,
      `» **Stats GDC** :`,
      ` ➥ \`${clan?.warWins ?? 0}\` gagnées • \`${clan?.warLosses ?? 0}\` perdues • \`${clan?.warTies ?? 0}\` égalités`,
      `» **Série actuelle** : \`${clan?.warWinStreak ?? 0}\``,
      `» **Taux de victoire** : \`${winRate}%\``
    ].join("\n");
  
    const warInfoText = [
      `» **Journal de guerre public** : ${clan?.isWarLogPublic ? "Oui" : "Non"}`,
      `» **Membres** : \`${clan?.members ?? members.length ?? 0}/50\``
    ].join("\n");
  
    const lastWarsText = `### 3 dernières guerres\n${formatWarLogEntries(warLog, clan?.name ?? "Clan")}`;
  
    const container = new ContainerBuilder();
    const headerSection = new SectionBuilder().addTextDisplayComponents(makeTextDisplay(headerText));
    const badgeUrl = getBadgeUrl(clan);
  
    if (badgeUrl) {
      headerSection.setThumbnailAccessory(new ThumbnailBuilder().setURL(badgeUrl));
    }
  
    container
      .addSectionComponents(headerSection)
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(overviewText))
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(formatTownHallDistribution(members, clan?.members ?? members.length)))
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(warInfoText))
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(lastWarsText))
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(`-# Mis à jour le ${formatLastUpdated()} (heure de Paris)`));
  
    return container;
  }
  
  function buildCapitalContainer(clan, raidSeasons) {
    const capitalTrophies = clan?.capitalPoints ?? clan?.clanCapitalPoints ?? 0;
  
    const container = new ContainerBuilder();
    const headerSection = new SectionBuilder().addTextDisplayComponents(
      makeTextDisplay([
        `## ${clan?.name ?? "Clan inconnu"} — Vue Capitale`,
        `🏛️ **Hôtel de capitale** : **${clan?.clanCapital?.capitalHallLevel ?? "N/A"}**`,
        `🏯 **Ligue capitale** : **${translateCapitalLeagueName(clan?.capitalLeague?.name ?? null)}**`,
        `🏆 **Trophées Capitale** : **${formatNumber(capitalTrophies)}**`
      ].join("\n"))
    );
  
    const badgeUrl = getBadgeUrl(clan);
    if (badgeUrl) {
      headerSection.setThumbnailAccessory(new ThumbnailBuilder().setURL(badgeUrl));
    }
  
    container
      .addSectionComponents(headerSection)
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(`### 3 derniers week-ends\n${formatCapitalWeekendTable(raidSeasons)}`))
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(formatCapitalLegend()))
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(`### Districts\n${formatDistricts(clan)}`))
      .addSeparatorComponents(makeSeparator())
      .addTextDisplayComponents(makeTextDisplay(`-# Mis à jour le ${formatLastUpdated()} (heure de Paris)`));
  
    return container;
  }
  
  function addCommonControls(container, clanTag, activeView, sortedMembers, memberPage, totalPages) {
    container
      .addSeparatorComponents(makeSeparator())
      .addActionRowComponents(buildNavButtons(clanTag, activeView, memberPage))
      .addActionRowComponents(buildMemberSelectRow(clanTag, sortedMembers, memberPage));
  
    if (totalPages > 1) {
      container.addActionRowComponents(
        buildMemberPageButtons(clanTag, activeView, memberPage, totalPages)
      );
    }
  
    return container;
  }
  
  export async function buildClanV2Message({ clanTag, token, view = "overview", memberPage = 0 }) {
    const { clan, members } = await fetchClanContext(clanTag, token);
  
    const safeView = normalizeView(view);
    const sortedMembers = sortMembersByTrophies(members);
    const safePage = clampMemberPage(memberPage, sortedMembers.length);
    const totalPages = Math.max(1, Math.ceil(sortedMembers.length / MEMBERS_PER_PAGE));
  
    let container;
  
    if (safeView === "war") {
      let warLog = [];
      try {
        warLog = await getClanWarLog(clanTag, token, 3);
      } catch {
        warLog = [];
      }
  
      container = buildWarContainer(clan, members, warLog);
    } else if (safeView === "capital") {
      let raidSeasons = [];
      try {
        raidSeasons = await getCapitalRaidSeasons(clanTag, token, 3);
      } catch {
        raidSeasons = [];
      }
  
      container = buildCapitalContainer(clan, raidSeasons);
    } else {
      container = buildOverviewContainer(clan, members);
    }
  
    addCommonControls(container, clanTag, safeView, sortedMembers, safePage, totalPages);
  
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    };
  }
  
  export async function buildClanMemberEphemeralMessage({ clanTag, token, memberTag }) {
    const { clan, members } = await fetchClanContext(clanTag, token);
    const member = members.find(
      (entry) => String(entry?.tag ?? "").toUpperCase() === String(memberTag ?? "").toUpperCase()
    );
  
    if (!member) {
      return {
        content: "❌ Membre introuvable dans ce clan.",
        ephemeral: true
      };
    }
  
    const leagueName = member?.league?.name ?? "Non classé";
    const thumbnail =
      member?.league?.iconUrls?.medium ||
      member?.league?.iconUrls?.small ||
      getBadgeUrl(clan) ||
      undefined;
  
    const embed = new EmbedBuilder()
      .setTitle(`${member?.name ?? "Membre inconnu"} • ${clan?.name ?? "Clan"}`)
      .setDescription([
        `${getTownHallEmoji(member?.townHallLevel ?? 10)} **HDV ${member?.townHallLevel ?? "?"}**`,
        `**Rôle** : ${translateRole(member?.role)}`,
        `**Tag** : \`${member?.tag ?? "?"}\``
      ].join("\n"))
      .addFields(
        {
          name: "Trophées",
          value: `🏆 ${formatNumber(member?.trophies ?? 0)}`,
          inline: true
        },
        {
          name: "Trophées BB",
          value: `🛠️ ${formatNumber(member?.builderBaseTrophies ?? 0)}`,
          inline: true
        },
        {
          name: "Niveau XP",
          value: `⭐ ${formatNumber(member?.expLevel ?? 0)}`,
          inline: true
        },
        {
          name: "Classement clan",
          value: `#${formatNumber(member?.clanRank ?? 0)}`,
          inline: true
        },
        {
          name: "Dons",
          value: `📤 ${formatNumber(member?.donations ?? 0)}`,
          inline: true
        },
        {
          name: "Reçus",
          value: `📥 ${formatNumber(member?.donationsReceived ?? 0)}`,
          inline: true
        },
        {
          name: "Ligue multijoueur",
          value: leagueName,
          inline: false
        },
        {
          name: "Variation rang clan",
          value: `Avant : **${formatNumber(member?.previousClanRank ?? 0)}**`,
          inline: false
        }
      )
      .setFooter({
        text: `Vue éphémère • ${clan?.name ?? "Clan"} • ${formatLastUpdated()}`
      });
  
    if (thumbnail) {
      embed.setThumbnail(thumbnail);
    }
  
    return {
      embeds: [embed],
      ephemeral: true
    };
  }