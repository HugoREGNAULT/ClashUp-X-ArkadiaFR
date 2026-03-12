import { AttachmentBuilder } from "discord.js";
import { getMainParsedImport } from "./myStorageService.js";
import { computeVillageProgress } from "./myProgressService.js";
import { renderVillageCard } from "../utils/cardRenderer.js";

export async function handleCard(interaction) {

  await interaction.deferReply();

  const parsed = await getMainParsedImport(interaction.user.id);

  if (!parsed) {
    return interaction.editReply("❌ Aucun profil importé.");
  }

  const progress = computeVillageProgress(parsed, parsed.townHall);

  const buffer = await renderVillageCard(parsed, progress);

  const attachment = new AttachmentBuilder(buffer, {
    name: "village-card.png"
  });

  await interaction.editReply({
    files: [attachment]
  });
}