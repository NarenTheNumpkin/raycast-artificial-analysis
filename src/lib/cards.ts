import { familyName } from "./families";
import { formatScore } from "./metrics";
import type { RankedModel } from "./models";
import { providerInitials } from "./providers";

export type Appearance = "light" | "dark";

export function escapeXml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!,
  );
}

function palette(theme: Appearance) {
  return theme === "dark"
    ? { background: "#1c2330", border: "#334155", text: "#f1f5f9", muted: "#a3b2c7", accent: "#7dd3fc" }
    : { background: "#f0f5fc", border: "#d3dfef", text: "#172033", muted: "#52627a", accent: "#0369a1" };
}

export function monogramSvg(creator: string, theme: Appearance): string {
  const p = palette(theme);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${p.border}"/><text x="32" y="41" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="25" font-weight="700" fill="${p.text}">${escapeXml(providerInitials(creator))}</text></svg>`;
}

function labelLines(text: string): string[] {
  const words = text.split(/\s+/);
  const lines = [""];
  for (const word of words) {
    const index = lines.length - 1;
    const next = `${lines[index]} ${word}`.trim();
    if (next.length <= 25) lines[index] = next;
    else if (lines.length < 2 && lines[index]) lines.push(word);
    else {
      lines[index] = `${next.slice(0, 23).trimEnd()}…`;
      break;
    }
  }
  return lines;
}

export function modelCardSvg(model: RankedModel, theme: Appearance, logo: string): string {
  const p = palette(theme);
  const embedded = logo
    .replace(/<\?xml[^>]*>/g, "")
    .replace(
      /<svg\b([^>]*)>/,
      (_match, attributes: string) =>
        `<svg${attributes.replace(/\s(?:width|height|x|y)="[^"]*"/g, "")} x="22" y="20" width="38" height="38">`,
    );
  const lines = labelLines(familyName(model.name));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="405" viewBox="0 0 360 202.5" style="color:${p.text}">
<rect x="1" y="1" width="358" height="200.5" rx="20" fill="${p.background}" stroke="${p.border}" stroke-width="2"/>
<g fill="${p.text}" color="${p.text}">${embedded}</g>
<text x="335" y="45" text-anchor="end" font-family="Helvetica,Arial,sans-serif" font-size="20" font-weight="600" fill="${p.muted}">#${model.rank}</text>
${lines.map((line, index) => `<text x="22" y="${89 + index * 27}" font-family="Helvetica,Arial,sans-serif" font-size="23" font-weight="600" fill="${p.text}">${escapeXml(line)}</text>`).join("")}
<text x="20" y="184" font-family="Helvetica,Arial,sans-serif" font-size="66" font-weight="700" letter-spacing="-2" fill="${p.accent}">${formatScore(model.intelligence)}</text>
</svg>`;
}

export function browseCardSvg(count: number, theme: Appearance): string {
  const p = palette(theme);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="405" viewBox="0 0 360 202.5">
<rect x="1" y="1" width="358" height="200.5" rx="20" fill="${p.background}" stroke="${p.border}" stroke-width="2"/>
<path d="M26 32h29m-29 12h29m-29 12h29m245 102 15 12-15 12m-23-12h37" stroke="${p.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<text x="22" y="100" font-family="Helvetica,Arial,sans-serif" font-size="27" font-weight="600" fill="${p.text}">Browse all models</text>
<text x="22" y="145" font-family="Helvetica,Arial,sans-serif" font-size="21" fill="${p.muted}">${count} evaluated entries</text></svg>`;
}
