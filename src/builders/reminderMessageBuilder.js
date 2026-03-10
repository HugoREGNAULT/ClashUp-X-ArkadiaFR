import {
    ContainerBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder
  } from "discord.js";
  
  function separator() {
    return new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(SeparatorSpacingSize.Large);
  }
  
  export function buildReminderCreatedV2({
    message,
    pseudo,
    durationLabel,
    remindAt,
    dmAvailable
  }) {
    const headerBlock = [
      "## ⏰ Reminder enregistré",
      `⎬**Message** : ${message}`,
      `⎬**Compte** : **${pseudo || "Non renseigné"}**`,
      `⎬**Durée** : **${durationLabel}**`
    ].join("\n");
  
    const infoBlock = [
      `⎬**Rappel prévu** : <t:${remindAt}:F>`,
      `⎬**Temps restant** : <t:${remindAt}:R>`,
      "",
      dmAvailable
        ? "📩 Le rappel sera envoyé en **message privé**."
        : "⚠️ Je n’ai pas pu confirmer tes MP. Si le MP échoue, le rappel sera envoyé dans le **salon d’origine**."
    ].join("\n");
  
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(headerBlock)
      )
      .addSeparatorComponents(separator())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(infoBlock)
      );
  
    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
  
  export function buildRemindersListV2(reminders) {
    const container = new ContainerBuilder();
  
    const intro = [
      "## ⏰ Tes rappels actifs",
      `Tu as **${reminders.length}** reminder(s) actif(s).`
    ].join("\n");
  
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(intro)
    );
  
    reminders.slice(0, 10).forEach((reminder, index) => {
      container.addSeparatorComponents(separator());
  
      const block = [
        `### ${index + 1}. ${reminder.message}`,
        `⎬**Compte** : **${reminder.pseudo || "Non renseigné"}**`,
        `⎬**Prévu** : <t:${reminder.remindAt}:F>`,
        `⎬**Temps restant** : <t:${reminder.remindAt}:R>`
      ].join("\n");
  
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(block)
      );
    });
  
    if (reminders.length > 10) {
      container.addSeparatorComponents(separator());
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `⚠️ Affichage limité à **10 reminders** sur **${reminders.length}**.`
        )
      );
    }
  
    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
  
  export function buildNoRemindersV2() {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "## 📭 Aucun reminder actif\nTu n'as actuellement aucun reminder enregistré."
      )
    );
  
    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
  
  export function buildReminderDmV2(reminder) {
    const block = [
      "## ⏰ Rappel Clash of Clans",
      `⎬**Message** : ${reminder.message}`,
      `⎬**Compte** : **${reminder.pseudo || "Non renseigné"}**`,
      `⎬**Prévu pour** : <t:${reminder.remindAt}:F>`
    ].join("\n");
  
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(block)
      );
  
    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }
  
  export function buildReminderFallbackV2(reminder) {
    const block = [
      "## ⏰ Rappel Clash of Clans",
      `⎬**Message** : ${reminder.message}`,
      `⎬**Compte** : **${reminder.pseudo || "Non renseigné"}**`,
      `⎬**Prévu pour** : <t:${reminder.remindAt}:F>`,
      "",
      "⚠️ MP indisponible : rappel envoyé dans le salon d’origine."
    ].join("\n");
  
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(block)
      );
  
    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };
  }