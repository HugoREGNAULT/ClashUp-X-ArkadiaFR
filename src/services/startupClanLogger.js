import {
    getClan,
    getCurrentWar,
    getLeagueGroup,
    getWarLog
  } from "./cocApi.js";
  import { translateWarLeagueName } from "../constants/warLeagueTranslations.js";
  
  function formatTag(tag) {
    return tag.startsWith("#") ? tag : `#${tag}`;
  }
  
  function safeNumber(value, fallback = 0) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }
  
  function pct(value) {
    if (typeof value !== "number") return "N/A";
    return `${value.toFixed(1)}%`;
  }
  
  function starsPerWar(wars) {
    const values = wars
      .map((w) => w?.clan?.stars)
      .filter((v) => typeof v === "number");
  
    if (!values.length) return "N/A";
  
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return avg.toFixed(1);
  }
  
  function destructionPerWar(wars) {
    const values = wars
      .map((w) => w?.clan?.destructionPercentage)
      .filter((v) => typeof v === "number");
  
    if (!values.length) return "N/A";
  
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return `${avg.toFixed(1)}%`;
  }
  
  function getWarResultLine(currentWar, clanTag) {
    if (!currentWar || currentWar.state === "notInWar") {
      return "Aucune guerre en cours";
    }
  
    const ourClan =
      currentWar.clan?.tag === clanTag ? currentWar.clan : currentWar.opponent;
    const enemyClan =
      currentWar.clan?.tag === clanTag ? currentWar.opponent : currentWar.clan;
  
    if (!ourClan || !enemyClan) {
      return `État: ${currentWar.state ?? "inconnu"}`;
    }
  
    return [
      `État: ${currentWar.state ?? "inconnu"}`,
      `Adversaire: ${enemyClan.name ?? "Inconnu"} (${enemyClan.tag ?? "?"})`,
      `Score étoiles: ${safeNumber(ourClan.stars)} - ${safeNumber(enemyClan.stars)}`,
      `Destruction: ${pct(ourClan.destructionPercentage)} - ${pct(enemyClan.destructionPercentage)}`,
      `Attaques: ${safeNumber(ourClan.attacks)} / ${safeNumber(currentWar.teamSize) * safeNumber(currentWar.attacksPerMember, 2)}`
    ].join(" | ");
  }
  
  function getLeagueGroupLine(group) {
    if (!group) return "Aucune CWL active / non disponible";
  
    const season = group.season ?? "N/A";
    const state = group.state ?? "inconnu";
    const rounds = Array.isArray(group.rounds) ? group.rounds.length : 0;
    const clans = Array.isArray(group.clans) ? group.clans.length : 0;
  
    return `CWL: ${state} | Saison: ${season} | Rounds: ${rounds} | Clans: ${clans}`;
  }
  
  export async function logRegisteredClansWarStats(env) {
    const clans = [
      {
        key: "ARKADIA",
        tag: formatTag(env.CLAN_ARKADIA)
      },
      {
        key: "POLIS",
        tag: formatTag(env.CLAN_POLIS)
      }
    ].filter((c) => c.tag && c.tag !== "#undefined");
  
    console.log("\n================= CLAN WAR STARTUP REPORT =================");
  
    for (const entry of clans) {
      try {
        const [clan, currentWar, warLog, leagueGroup] = await Promise.all([
          getClan(entry.tag, env.COC_API_TOKEN),
          getCurrentWar(entry.tag, env.COC_API_TOKEN),
          getWarLog(entry.tag, env.COC_API_TOKEN, 10),
          getLeagueGroup(entry.tag, env.COC_API_TOKEN)
        ]);
  
        if (!clan) {
          console.log(`\n[${entry.key}] ${entry.tag}`);
          console.log("Impossible de récupérer le profil du clan.");
          continue;
        }
  
        const wins = safeNumber(clan.warWins);
        const losses = safeNumber(clan.warLosses);
        const ties = safeNumber(clan.warTies);
        const streak = safeNumber(clan.warWinStreak);
        const totalTracked = wins + losses + ties;
        const winRate = totalTracked > 0 ? ((wins / totalTracked) * 100).toFixed(1) : "N/A";
  
        console.log(`\n[${entry.key}] ${clan.name} (${clan.tag})`);
        console.log(`Niveau: ${clan.clanLevel ?? "?"} | Membres: ${clan.members ?? "?"}/50`);
        console.log(`Ligue CWL: ${translateWarLeagueName(clan.warLeague?.name)}`);
        console.log(`War log public: ${clan.isWarLogPublic ? "Oui" : "Non"}`);
        console.log(`Stats globales: ${wins}V / ${losses}D / ${ties}E | Série: ${streak} | Winrate: ${winRate === "N/A" ? "N/A" : `${winRate}%`}`);
        console.log(`Guerre en cours: ${getWarResultLine(currentWar, clan.tag)}`);
        console.log(`GDC récentes (10): ${warLog.length ? `${warLog.length} récupérées | Moy. étoiles: ${starsPerWar(warLog)} | Moy. destruction: ${destructionPerWar(warLog)}` : "Aucune donnée / journal privé"}`);
        console.log(getLeagueGroupLine(leagueGroup));
      } catch (error) {
        console.log(`\n[${entry.key}] ${entry.tag}`);
        console.log(`Erreur: ${error.message}`);
      }
    }
  
    console.log("===========================================================\n");
  }