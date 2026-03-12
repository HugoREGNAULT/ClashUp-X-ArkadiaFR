import { createCanvas } from "@napi-rs/canvas";

export async function renderVillageCard(parsed, progress) {

  const width = 900;
  const height = 420;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#0f1b2e";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "28px sans-serif";
  ctx.fillText(`Town Hall ${parsed.townHall}`, 300, 60);

  const bars = [
    ["Structures", progress.buildings],
    ["Supercharges", progress.supercharges ?? 0],
    ["Crafted Def.", progress.crafted ?? 0],
    ["Heroes", progress.heroes],
    ["Equipment", progress.guards],
    ["Troops", progress.troops],
    ["Spells", progress.spells],
    ["Sieges", progress.sieges],
    ["Pets", progress.pets],
    ["Walls", progress.walls]
  ];

  let y = 120;

  for (const [label, percent] of bars) {

    const barWidth = 350;
    const barHeight = 20;

    ctx.fillStyle = "#2a3446";
    ctx.fillRect(300, y, barWidth, barHeight);

    ctx.fillStyle = "#4da3ff";
    ctx.fillRect(300, y, (percent / 100) * barWidth, barHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px sans-serif";
    ctx.fillText(`${percent}%`, 310, y + 15);

    ctx.fillText(label, 660, y + 15);

    y += 32;
  }

  return canvas.toBuffer("image/png");
}