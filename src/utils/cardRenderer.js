import { createCanvas } from "@napi-rs/canvas";

function clampPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, width, height, radius, color) {
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, width, height, radius, color, lineWidth = 1) {
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawPanel(ctx, x, y, width, height, options = {}) {
  const {
    radius = 24,
    fill = "rgba(10, 18, 36, 0.84)",
    stroke = "rgba(168, 220, 255, 0.14)",
    strokeWidth = 1
  } = options;

  fillRoundRect(ctx, x, y, width, height, radius, fill);
  strokeRoundRect(ctx, x, y, width, height, radius, stroke, strokeWidth);
}

function drawText(ctx, text, x, y, options = {}) {
  const {
    font = "28px sans-serif",
    color = "#ffffff",
    align = "left",
    baseline = "alphabetic",
    alpha = 1
  } = options;

  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.globalAlpha = alpha;
  ctx.fillText(String(text), x, y);
  ctx.restore();
}

function createHorizontalGradient(ctx, x, width, startColor, endColor) {
  const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  return gradient;
}

function drawBackground(ctx, width, height) {
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#081426");
  bg.addColorStop(1, "#0D213D");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const glowTop = ctx.createRadialGradient(width * 0.18, 90, 20, width * 0.18, 90, 300);
  glowTop.addColorStop(0, "rgba(96, 176, 255, 0.15)");
  glowTop.addColorStop(1, "rgba(96, 176, 255, 0)");
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, width, height);

  const glowBottom = ctx.createRadialGradient(width * 0.85, height * 0.82, 20, width * 0.85, height * 0.82, 320);
  glowBottom.addColorStop(0, "rgba(65, 119, 223, 0.16)");
  glowBottom.addColorStop(1, "rgba(65, 119, 223, 0)");
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, width, height);
}

function getBarTheme(label) {
  const themes = {
    "Structures": ["#63B7FF", "#3D86F6"],
    "Supercharges": ["#8B7FFF", "#5A49F5"],
    "Défenses assemblées": ["#61CFFF", "#2995DA"],
    "Héros": ["#FFB66B", "#F18B43"],
    "Équipements": ["#74D2FF", "#4C9EFF"],
    "Troupes": ["#68C3FF", "#4A8FFF"],
    "Sorts": ["#A08FFF", "#6B58F7"],
    "Engins": ["#61DFC6", "#2DAA8D"],
    "Familiers": ["#FF96C0", "#E46B9E"],
    "Gardiens": ["#C6D76D", "#95B23D"],
    "Remparts": ["#B7C3D0", "#8597AC"]
  };

  return themes[label] ?? ["#6EC1FF", "#4A90FF"];
}

function drawProgressRow(ctx, config) {
  const {
    x,
    y,
    width,
    label,
    percent,
    startColor,
    endColor
  } = config;

  const value = clampPercent(percent);
  const barY = y + 14;
  const barH = 18;
  const radius = 9;

  drawText(ctx, label, x, y, {
    font: "700 22px sans-serif",
    color: "#EEF5FF",
    baseline: "top"
  });

  drawText(ctx, `${value}%`, x + width, y, {
    font: "700 21px sans-serif",
    color: "#B9DEFF",
    align: "right",
    baseline: "top"
  });

  fillRoundRect(ctx, x, barY + 26, width, barH, radius, "rgba(255, 255, 255, 0.10)");

  if (value > 0) {
    const fillWidth = Math.max(0, Math.min(width, (value / 100) * width));
    const gradient = createHorizontalGradient(ctx, x, width, startColor, endColor);
    fillRoundRect(ctx, x, barY + 26, fillWidth, barH, radius, gradient);
  }

  strokeRoundRect(ctx, x, barY + 26, width, barH, radius, "rgba(255, 255, 255, 0.04)", 1);
}

function drawSection(ctx, config) {
  const {
    x,
    y,
    width,
    title,
    items
  } = config;

  const rowHeight = 66;
  const sectionHeight = 72 + items.length * rowHeight;

  drawPanel(ctx, x, y, width, sectionHeight, {
    radius: 22,
    fill: "rgba(8, 18, 36, 0.72)",
    stroke: "rgba(168, 220, 255, 0.08)"
  });

  drawText(ctx, title, x + 22, y + 22, {
    font: "700 24px sans-serif",
    color: "#FFFFFF"
  });

  const rowX = x + 22;
  const rowW = width - 44;
  const startY = y + 58;

  items.forEach(([label, value], index) => {
    const [startColor, endColor] = getBarTheme(label);
    drawProgressRow(ctx, {
      x: rowX,
      y: startY + index * rowHeight,
      width: rowW,
      label,
      percent: value,
      startColor,
      endColor
    });
  });

  return sectionHeight;
}

function computeDisplayedOverall(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return 0;
  const values = categories.map(([, value]) => clampPercent(value));
  const sum = values.reduce((acc, value) => acc + value, 0);
  return clampPercent(sum / values.length);
}

export async function renderVillageCard(parsed, progress) {
  const width = 1180;
  const height = 980;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  drawBackground(ctx, width, height);

  const frameX = 36;
  const frameY = 34;
  const frameW = width - 72;
  const frameH = height - 68;

  drawPanel(ctx, frameX, frameY, frameW, frameH, {
    radius: 30,
    fill: "rgba(7, 15, 30, 0.56)",
    stroke: "rgba(168, 220, 255, 0.14)",
    strokeWidth: 2
  });

  const defenseItems = [
    ["Structures", progress?.buildings ?? 0],
    ["Supercharges", progress?.supercharges ?? 0],
    ["Défenses assemblées", progress?.crafted ?? 0],
    ["Remparts", progress?.walls ?? 0]
  ];

  const armyItems = [
    ["Héros", progress?.heroes ?? 0],
    ["Équipements", progress?.equipment ?? 0],
    ["Troupes", progress?.troops ?? 0],
    ["Sorts", progress?.spells ?? 0],
    ["Engins", progress?.sieges ?? 0],
    ["Familiers", progress?.pets ?? 0],
    ["Gardiens", progress?.guards ?? 0]
  ];

  const allDisplayed = [...defenseItems, ...armyItems];
  const overall = computeDisplayedOverall(allDisplayed);

  const headerX = 64;
  const headerY = 60;
  const headerW = width - 128;
  const headerH = 176;

  drawPanel(ctx, headerX, headerY, headerW, headerH, {
    radius: 28,
    fill: "rgba(10, 22, 43, 0.92)",
    stroke: "rgba(168, 220, 255, 0.12)",
    strokeWidth: 1.5
  });

  const badgeX = headerX + 28;
  const badgeY = headerY + 30;
  const badgeSize = 116;

  const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeSize);
  badgeGradient.addColorStop(0, "#91D6FF");
  badgeGradient.addColorStop(1, "#3B7FF4");
  fillRoundRect(ctx, badgeX, badgeY, badgeSize, badgeSize, 24, badgeGradient);

  drawText(ctx, "TH", badgeX + badgeSize / 2, badgeY + 34, {
    font: "700 24px sans-serif",
    color: "#F7FBFF",
    align: "center",
    baseline: "middle"
  });

  drawText(ctx, parsed?.townHall ?? "?", badgeX + badgeSize / 2, badgeY + 78, {
    font: "700 42px sans-serif",
    color: "#FFFFFF",
    align: "center",
    baseline: "middle"
  });

  const titleX = badgeX + badgeSize + 28;
  const playerName = parsed?.playerName?.trim() || parsed?.playerTag?.trim() || "Village";
  const playerTag = parsed?.playerTag?.trim() || "Tag inconnu";

  drawText(ctx, "ARKADIA", titleX, headerY + 44, {
    font: "700 22px sans-serif",
    color: "#A8DCFF"
  });

  drawText(ctx, "Carte du village", titleX, headerY + 92, {
    font: "700 42px sans-serif",
    color: "#FFFFFF"
  });

  drawText(ctx, playerName, titleX, headerY + 129, {
    font: "600 27px sans-serif",
    color: "rgba(238, 245, 255, 0.94)"
  });

  drawText(ctx, playerTag, titleX, headerY + 160, {
    font: "500 22px sans-serif",
    color: "rgba(230, 240, 255, 0.66)"
  });

  const globalCardW = 280;
  const globalCardH = 118;
  const globalCardX = headerX + headerW - globalCardW - 26;
  const globalCardY = headerY + 29;

  drawPanel(ctx, globalCardX, globalCardY, globalCardW, globalCardH, {
    radius: 22,
    fill: "rgba(8, 17, 34, 0.84)",
    stroke: "rgba(168, 220, 255, 0.10)"
  });

  drawText(ctx, "Progression globale", globalCardX + 22, globalCardY + 33, {
    font: "700 22px sans-serif",
    color: "#EAF4FF"
  });

  drawText(ctx, `${overall}%`, globalCardX + 22, globalCardY + 84, {
    font: "700 46px sans-serif",
    color: "#FFFFFF"
  });

  const globalBarX = globalCardX + 150;
  const globalBarY = globalCardY + 66;
  const globalBarW = 92;
  const globalBarH = 16;

  fillRoundRect(ctx, globalBarX, globalBarY, globalBarW, globalBarH, 8, "rgba(255, 255, 255, 0.10)");
  if (overall > 0) {
    const globalGradient = createHorizontalGradient(ctx, globalBarX, globalBarW, "#A8DCFF", "#4C96FF");
    fillRoundRect(
      ctx,
      globalBarX,
      globalBarY,
      Math.max(8, (overall / 100) * globalBarW),
      globalBarH,
      8,
      globalGradient
    );
  }

  const bodyX = 64;
  const bodyY = 262;
  const bodyW = width - 128;
  const bodyH = height - bodyY - 56;

  drawPanel(ctx, bodyX, bodyY, bodyW, bodyH, {
    radius: 28,
    fill: "rgba(10, 22, 42, 0.90)",
    stroke: "rgba(168, 220, 255, 0.08)"
  });

  drawText(ctx, "Progression du village", bodyX + 30, bodyY + 42, {
    font: "700 30px sans-serif",
    color: "#FFFFFF"
  });

  drawText(ctx, "Vue synthétique par groupe", bodyX + bodyW - 30, bodyY + 42, {
    font: "500 18px sans-serif",
    color: "rgba(234, 244, 255, 0.55)",
    align: "right"
  });

  const sectionX = bodyX + 26;
  const sectionW = bodyW - 52;

  const defenseHeight = drawSection(ctx, {
    x: sectionX,
    y: bodyY + 70,
    width: sectionW,
    title: "Défenses",
    items: defenseItems
  });

  drawSection(ctx, {
    x: sectionX,
    y: bodyY + 88 + defenseHeight,
    width: sectionW,
    title: "Armée",
    items: armyItems
  });

  return canvas.toBuffer("image/png");
}