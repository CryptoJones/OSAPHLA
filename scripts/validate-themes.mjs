import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const css = await readFile(resolve(import.meta.dirname, "../src/styles.css"), "utf8");
const blocks = [...css.matchAll(/:root\[data-theme="([^"]+)"\]\s*\{([^}]+)\}/g)];

function luminance(hex) {
  if (hex.length === 4) hex = `#${[...hex.slice(1)].map((digit) => digit.repeat(2)).join("")}`;
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const failures = [];
let validated = 0;
for (const [, name, body] of blocks) {
  const colors = Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})(?![0-9a-fA-F])/g)].map((match) => [match[1], match[2]]));
  if (!["bg", "surface", "text", "muted", "accent", "accent-2", "border"].every((key) => colors[key])) continue;
  validated += 1;
  const checks = [
    ["body text/background", colors.text, colors.bg, 4.5],
    ["body text/surface", colors.text, colors.surface, 4.5],
    ["muted text/background", colors.muted, colors.bg, 4.5],
    ["accent/background", colors.accent, colors.bg, 4.5],
    ["secondary accent/background", colors["accent-2"], colors.bg, 4.5],
    ["border/background", colors.border, colors.bg, 3]
  ];
  for (const [label, foreground, background, minimum] of checks) {
    const ratio = contrast(foreground, background);
    if (ratio < minimum) failures.push(`${name}: ${label} is ${ratio.toFixed(2)}:1; expected ${minimum}:1`);
  }
}

if (failures.length) throw new Error(`Theme contrast validation failed:\n${failures.join("\n")}`);
console.log(`THEMES VALID: ${validated} explicit palettes satisfy functional WCAG contrast checks.`);
