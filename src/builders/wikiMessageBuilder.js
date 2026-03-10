import {
    ContainerBuilder,
    MessageFlags,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder
  } from "discord.js";
  
  const ACCENT_COLOR = 0xA8DCFF;
  
  export function buildWikiMyV2() {
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT_COLOR)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("## 📚 Wiki /my"),
        new TextDisplayBuilder().setContent(
          [
            "**Commandes actuellement disponibles**",
            "",
            "`/my import` • importe un export JSON Clash of Clans",
            "`/my profile` • affiche ton profil et les boutons de navigation",
            "`/my setmain` • définit ton compte principal",
            "",
            "**Navigation du profil**",
            "",
            "`Aperçu` • résumé global du compte",
            "`Héros` • héros village principal + base des ouvriers",
            "`Troupes` • troupes importées",
            "`Sorts` • sorts importés",
            "`Familiers` • pets/familiers",
            "`Engins` • engins de siège",
            "`Équipements` • équipements héroïques",
            "`Remparts` • répartition des remparts par niveau",
            "`Amélios` • hub d’améliorations (comparaison max HDV plus tard)",
            "`Bâtiments` • bâtiments détectés",
            "",
            "**Conseil**",
            "",
            "Après une mise à jour du parser, pense à refaire `/my import` pour enrichir les données."
          ].join("\n")
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "_Le wiki /my pourra être enrichi plus tard avec les prochains modules : progress, upgrades, walls, etc._"
        )
      );
  
    return {
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    };
  }