import {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    MessageFlags
  } from "discord.js";
  
  import { getEmoji } from "../constants/myEmojis.js";
  
  export function buildMyProfileCard(parsed, apiPlayer) {
  
    const thEmoji = getEmoji("townHall", parsed.townHall);
  
    const leagueBadge = apiPlayer?.league?.iconUrls?.medium ?? null;
  
    const clanName = apiPlayer?.clan?.name ?? "Sans clan";
    const clanTag = apiPlayer?.clan?.tag;
  
    const clanLink = clanTag
      ? `[${clanName}](https://link.clashofclans.com/?action=OpenClanProfile&tag=${clanTag.replace("#", "")})`
      : clanName;
  
    const lastImport = Math.floor(new Date(parsed.lastSyncAt).getTime() / 1000);
  
    const container = new ContainerBuilder()
      .setAccentColor(0xA8DCFF);
  
    if (leagueBadge) {
      container.setThumbnail(leagueBadge);
    }
  
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
  `## ${apiPlayer.name}
  
  **Tag :** ${parsed.playerTag}
  
  ${thEmoji} **HDV ${parsed.townHall}**
  
  🏅 **Niveau :** ${apiPlayer.expLevel}
  
  👥 **Clan :** ${clanLink}
  
  -# Dernier import : <t:${lastImport}:R>`
      )
    );
  
    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    );
  
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("my_profile_nav")
      .setPlaceholder("Voir une catégorie")
      .addOptions([
        {
          label: "Héros",
          value: "heroes"
        },
        {
          label: "Troupes",
          value: "troops"
        },
        {
          label: "Sorts",
          value: "spells"
        },
        {
          label: "Familiers",
          value: "pets"
        },
        {
          label: "Engins de siège",
          value: "sieges"
        },
        {
          label: "Équipements",
          value: "equipment"
        },
        {
          label: "Remparts",
          value: "walls"
        },
        {
          label: "Améliorations",
          value: "upgrades"
        }
      ]);
  
    const row = new ActionRowBuilder().addComponents(selectMenu);
  
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container, row]
    };
  }