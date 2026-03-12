import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder
  } from "discord.js";
  
  import { getTownHallEmoji } from "../constants/myEmojis.js";
  
  const ACCENT_COLOR = 0xA8DCFF;
  
  const ROLE_LABELS = {
    leader: "Chef",
    coLeader: "Chef adjoint",
    admin: "Aîné",
    member: "Membre"
  };
  
  const CATEGORY_META = {
    overview: { label: "Overview" },
    heroes: { label: "Héros" },
    troops: { label: "Troupes" },
    spells: { label: "Sorts" },
    sieges: { label: "Engins" },
    pets: { label: "Familiers" },
    guards: { label: "Gardiens" },
    walls: { label: "Remparts" },
    buildings: { label: "Bâtiments" }
  };
  
  function escapeMarkdown(text) {
    return String(text ?? "").replace(/([\[\]()_*~`>])/g, "\\$1");
  }
  
  function buildClanLink(apiPlayer) {
    const clanName = apiPlayer?.clan?.name;
    const clanTag = apiPlayer?.clan?.tag;
    const roleRaw = apiPlayer?.role;
    const role = ROLE_LABELS[roleRaw] ?? "Membre";
  
    if (!clanName || !clanTag) {
      return "Sans clan";
    }
  
    const cleanTag = clanTag.replace("#", "");
    const url = `https://link.clashofclans.com/?action=OpenClanProfile&tag=${cleanTag}`;
  
    return `[${escapeMarkdown(clanName)} — ${role}](${url})`;
  }
  
  function buildHeader(parsed, apiPlayer) {
    const playerName = apiPlayer?.name ?? parsed?.playerName ?? "Inconnu";
    const townHall = Number(parsed?.townHall || apiPlayer?.townHallLevel || 0);
    const thEmoji = getTownHallEmoji(townHall);
    const clanLink = buildClanLink(apiPlayer);
    const accountLevel = Number(apiPlayer?.expLevel || 0);
  
    return [
      `## ${escapeMarkdown(playerName)} (${clanLink})`,
      "",
      `⎬ ${thEmoji} HDV ${townHall}`,
      `⎬ <:p_:1481609871043465317> Niveau **${accountLevel}**`
    ].join("\n");
  }
  
  function buildOverviewBody(progress, parsed) {
    const lastImport =
      parsed?.lastSyncAt && !Number.isNaN(new Date(parsed.lastSyncAt).getTime())
        ? Math.floor(new Date(parsed.lastSyncAt).getTime() / 1000)
        : null;
  
    const lines = [
      "### 📊 Progression du village",
      "",
      `🗡 Héros — **${progress.heroes}%**`,
      `⚔️ Troupes — **${progress.troops}%**`,
      `🧪 Sorts — **${progress.spells}%**`,
      `🛠 Engins — **${progress.sieges}%**`,
      `🔥 Familiers — **${progress.pets}%**`,
      `🛡 Gardiens — **${progress.guards}%**`,
      `🧱 Remparts — **${progress.walls}%**`,
      `🏠 Bâtiments — **${progress.buildings}%**`
    ];
  
    if (lastImport) {
      lines.push("", `-# Dernier import : <t:${lastImport}:R>`);
    }
  
    return lines.join("\n");
  }
  
  function buildDetailBody({ title, icon, percent, lines, parsed }) {
    const lastImport =
      parsed?.lastSyncAt && !Number.isNaN(new Date(parsed.lastSyncAt).getTime())
        ? Math.floor(new Date(parsed.lastSyncAt).getTime() / 1000)
        : null;
  
    const body = [
      `### ${icon} | ${title} **${percent}%**`,
      "",
      ...(lines?.length ? lines : ["↳ Aucune donnée disponible"])
    ];
  
    if (lastImport) {
      body.push("", `-# Dernier import : <t:${lastImport}:R>`);
    }
  
    return body.join("\n");
  }
  
  function makeButton(view, activeView, userId, tag) {
    const meta = CATEGORY_META[view];
    const customId = `profile_${view}_${userId}_${String(tag || "").replace(/^#/, "")}`;
  
    return new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(meta.label)
      .setStyle(view === activeView ? ButtonStyle.Primary : ButtonStyle.Secondary);
  }
  
  function buildButtons(activeView, userId, tag) {
    const row1 = new ActionRowBuilder().addComponents(
      makeButton("overview", activeView, userId, tag),
      makeButton("heroes", activeView, userId, tag),
      makeButton("troops", activeView, userId, tag),
      makeButton("spells", activeView, userId, tag),
      makeButton("sieges", activeView, userId, tag)
    );
  
    const row2 = new ActionRowBuilder().addComponents(
      makeButton("pets", activeView, userId, tag),
      makeButton("guards", activeView, userId, tag),
      makeButton("walls", activeView, userId, tag),
      makeButton("buildings", activeView, userId, tag)
    );
  
    return [row1, row2];
  }
  
  function buildBaseContainer(parsed, apiPlayer, body) {
    const container = new ContainerBuilder().setAccentColor(ACCENT_COLOR);
  
    const leagueBadge = apiPlayer?.league?.iconUrls?.medium ?? null;
    if (leagueBadge) {
      container.setThumbnail(leagueBadge);
    }
  
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${buildHeader(parsed, apiPlayer)}\n\n${body}`)
    );
  
    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    );
  
    return container;
  }
  
  export function buildProfileOverview({ parsed, apiPlayer, progress, ownerId, tag }) {
    const container = buildBaseContainer(parsed, apiPlayer, buildOverviewBody(progress, parsed));
    const rows = buildButtons("overview", ownerId, tag);
  
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container, ...rows]
    };
  }
  
  export function buildProfileCategory({
    parsed,
    apiPlayer,
    progressPercent,
    ownerId,
    tag,
    title,
    icon,
    lines,
    categoryKey
  }) {
    const container = buildBaseContainer(
      parsed,
      apiPlayer,
      buildDetailBody({
        title,
        icon,
        percent: progressPercent,
        lines,
        parsed
      })
    );
  
    const rows = buildButtons(categoryKey, ownerId, tag);
  
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container, ...rows]
    };
  }