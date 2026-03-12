import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    ThumbnailBuilder
  } from "discord.js";
  
  import { getTownHallEmoji } from "../constants/myEmojis.js";
  
  const ACCENT_COLOR = 0xA8DCFF;
  
  const ROLE_LABELS = {
    leader: "Chef",
    coLeader: "Chef adjoint",
    admin: "Aîné",
    elder: "Aîné",
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
    return String(text ?? "").replace(/([\\`*_{}[\]()#+\-.!|>])/g, "\\$1");
  }
  
  function getRoleLabel(role) {
    return ROLE_LABELS[role] ?? "Membre";
  }
  
  function buildClanLink(apiPlayer) {
    const clanName = apiPlayer?.clan?.name;
    const clanTag = apiPlayer?.clan?.tag;
    const roleLabel = getRoleLabel(apiPlayer?.role);
  
    if (!clanName || !clanTag) {
      return "Sans clan";
    }
  
    const cleanTag = clanTag.replace("#", "");
    const url = `https://link.clashofclans.com/?action=OpenClanProfile&tag=%23${cleanTag}`;
  
    return `[${escapeMarkdown(clanName)} — ${escapeMarkdown(roleLabel)}](${url})`;
  }
  
  function buildHeader(parsed, apiPlayer) {
    const playerName = apiPlayer?.name ?? parsed?.playerName ?? "Inconnu";
    const townHall = Number(parsed?.townHall ?? apiPlayer?.townHallLevel ?? 0);
    const thEmoji = getTownHallEmoji(townHall);
    const clanLink = buildClanLink(apiPlayer);
    const accountLevel = Number(apiPlayer?.expLevel ?? 0);
  
    return [
      `## ${escapeMarkdown(playerName)} (${clanLink})`,
      "",
      `⎬ ${thEmoji} HDV ${townHall}`,
      `⎬ <:p_:1481609871043465317> Niveau **${accountLevel}**`
    ].join("\n");
  }
  
  function getLastImportLine(parsed) {
    const rawDate =
      parsed?.lastSyncAt ??
      parsed?.lastImport ??
      parsed?.updatedAt ??
      null;
  
    if (!rawDate) {
      return "-# Dernier import : inconnu";
    }
  
    const date = new Date(rawDate);
  
    if (Number.isNaN(date.getTime())) {
      return "-# Dernier import : inconnu";
    }
  
    const ts = Math.floor(date.getTime() / 1000);
  
    return `-# Dernier import : <t:${ts}:R>`;
  }
  
  function buildOverviewBody(progress) {
    return [
      "## 📊 Progression du village",
      "",
      `🗡 Héros — **${progress.heroes}%**`,
      `⚔️ Troupes — **${progress.troops}%**`,
      `🧪 Sorts — **${progress.spells}%**`,
      `🛠 Engins — **${progress.sieges}%**`,
      `🔥 Familiers — **${progress.pets}%**`,
      `🛡 Gardiens — **${progress.guards}%**`,
      `🧱 Remparts — **${progress.walls}%**`,
      `🏠 Bâtiments — **${progress.buildings}%**`
    ].join("\n");
  }
  
  function buildDetailBody({ title, icon, percent, lines }) {
    return [
      `## ${icon} | ${title} **${percent}%**`,
      "",
      ...(Array.isArray(lines) && lines.length ? lines : ["↳ Aucune donnée disponible"])
    ].join("\n");
  }
  
  function makeButton(view, activeView, ownerId, tag) {
    const meta = CATEGORY_META[view];
    const cleanTag = String(tag || "").replace(/^#/, "");
  
    return new ButtonBuilder()
      .setCustomId(`profile_${view}_${ownerId}_${cleanTag}`)
      .setLabel(meta.label)
      .setStyle(view === activeView ? ButtonStyle.Primary : ButtonStyle.Secondary);
  }
  
  function buildButtons(activeView, ownerId, tag) {
    const row1 = new ActionRowBuilder().addComponents(
      makeButton("overview", activeView, ownerId, tag),
      makeButton("heroes", activeView, ownerId, tag),
      makeButton("troops", activeView, ownerId, tag),
      makeButton("spells", activeView, ownerId, tag),
      makeButton("sieges", activeView, ownerId, tag)
    );
  
    const row2 = new ActionRowBuilder().addComponents(
      makeButton("pets", activeView, ownerId, tag),
      makeButton("guards", activeView, ownerId, tag),
      makeButton("walls", activeView, ownerId, tag),
      makeButton("buildings", activeView, ownerId, tag)
    );
  
    return [row1, row2];
  }
  
  function buildThumbnail(apiPlayer) {
  
    const leagueIcon =
      apiPlayer?.league?.iconUrls?.large ??
      apiPlayer?.league?.iconUrls?.medium ??
      apiPlayer?.league?.iconUrls?.small ??
      null;
  
    if (!leagueIcon) return null;
  
    return new ThumbnailBuilder().setURL(leagueIcon);
  }
  
  function buildSeparator() {
    return new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Large);
  }
  
  function buildContainer({ parsed, apiPlayer, body, activeView, ownerId, tag }) {
  
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT_COLOR);
  
    const thumbnail = buildThumbnail(apiPlayer);
  
    if (thumbnail) {
      container.addThumbnailComponents(thumbnail);
    }
  
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        buildHeader(parsed, apiPlayer)
      )
    );
  
    container.addSeparatorComponents(buildSeparator());
  
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(body)
    );
  
    container.addSeparatorComponents(buildSeparator());
  
    const rows = buildButtons(activeView, ownerId, tag);
  
    container.addActionRowComponents(...rows);
  
    container.addSeparatorComponents(buildSeparator());
  
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        getLastImportLine(parsed)
      )
    );
  
    return container;
  }
  
  export function buildProfileOverview({
    parsed,
    apiPlayer,
    progress,
    ownerId,
    tag
  }) {
  
    const container = buildContainer({
      parsed,
      apiPlayer,
      body: buildOverviewBody(progress),
      activeView: "overview",
      ownerId,
      tag
    });
  
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container]
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
  
    const container = buildContainer({
      parsed,
      apiPlayer,
      body: buildDetailBody({
        title,
        icon,
        percent: progressPercent,
        lines
      }),
      activeView: categoryKey,
      ownerId,
      tag
    });
  
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    };
  }