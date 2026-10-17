import { familyName } from "./families";
import type { RankedModel } from "./models";
import { providerInitials } from "./providers";

export type Appearance = "light" | "dark";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function escapeXml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!,
  );
}

function palette(theme: Appearance) {
  return theme === "dark"
    ? {
        background: "#1e2127",
        backgroundEnd: "#24282f",
        border: "#30353e",
        text: "#f3f5f8",
        muted: "#9aa3b2",
        accent: "#7cc4ff",
        monogram: "#363c47",
      }
    : {
        background: "#ffffff",
        backgroundEnd: "#f6f7f9",
        border: "#dfe3e8",
        text: "#151a23",
        muted: "#5d6878",
        accent: "#0b6bcb",
        monogram: "#e4e8ee",
      };
}

/** Filled gold, silver, and bronze pills for the podium; an outlined pill for everyone else. */
function rankColors(rank: number, theme: Appearance): { fill: string; text: string; stroke?: string } {
  const dark = theme === "dark";
  switch (rank) {
    case 1:
      return dark ? { fill: "rgba(250,204,21,0.18)", text: "#fcd34d" } : { fill: "#fef3c7", text: "#a16207" };
    case 2:
      return dark ? { fill: "rgba(226,232,240,0.2)", text: "#e2e8f0" } : { fill: "#e2e8f0", text: "#334155" };
    case 3:
      return dark ? { fill: "rgba(251,146,60,0.18)", text: "#fdba74" } : { fill: "#ffedd5", text: "#c2410c" };
    default:
      return { fill: "none", text: palette(theme).muted, stroke: palette(theme).border };
  }
}

function frame(theme: Appearance, body: string): string {
  const p = palette(theme);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="405" viewBox="0 0 360 202.5">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.background}"/><stop offset="1" stop-color="${p.backgroundEnd}"/></linearGradient></defs>
<rect x="1" y="1" width="358" height="200.5" rx="18" fill="url(#bg)" stroke="${p.border}" stroke-width="1.5"/>
${body}
</svg>`;
}

export function monogramSvg(creator: string, theme: Appearance): string {
  const p = palette(theme);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${p.monogram}"/><text x="32" y="41" text-anchor="middle" font-family="${FONT}" font-size="25" font-weight="700" fill="${p.text}">${escapeXml(providerInitials(creator))}</text></svg>`;
}

function labelLines(text: string): string[] {
  const words = text.split(/\s+/);
  const lines = [""];
  for (const word of words) {
    const index = lines.length - 1;
    const next = `${lines[index]} ${word}`.trim();
    if (next.length <= 24) lines[index] = next;
    else if (lines.length < 2 && lines[index]) lines.push(word);
    else {
      lines[index] = `${next.slice(0, 22).trimEnd()}…`;
      break;
    }
  }
  return lines;
}

/** A dashboard card: provider logo, rank pill, family name, and the headline score with its label. */
export function modelCardSvg(
  model: RankedModel,
  theme: Appearance,
  logo: string,
  score: { value: string; label: string },
): string {
  const p = palette(theme);
  const rank = rankColors(model.rank, theme);
  const embedded = logo
    .replace(/<\?xml[^>]*>/g, "")
    .replace(
      /<svg\b([^>]*)>/,
      (_match, attributes: string) =>
        `<svg${attributes.replace(/\s(?:width|height|x|y)="[^"]*"/g, "")} x="20" y="18" width="32" height="32">`,
    );
  const rankText = `#${model.rank}`;
  const pillWidth = 22 + rankText.length * 11;
  const lines = labelLines(familyName(model.name));
  return frame(
    theme,
    `<g fill="${p.text}" color="${p.text}">${embedded}</g>
<rect x="${340 - pillWidth}" y="19" width="${pillWidth}" height="30" rx="15" fill="${rank.fill}"${rank.stroke ? ` stroke="${rank.stroke}" stroke-width="1.5"` : ""}/>
<text x="${340 - pillWidth / 2}" y="40" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="700" fill="${rank.text}">${escapeXml(rankText)}</text>
${lines.map((line, index) => `<text x="20" y="${88 + index * 27}" font-family="${FONT}" font-size="23" font-weight="600" fill="${p.text}">${escapeXml(line)}</text>`).join("\n")}
<text x="18" y="180" font-family="${FONT}" font-size="54" font-weight="700" letter-spacing="-1.5" fill="${p.accent}">${escapeXml(score.value)}</text>
<text x="340" y="177" text-anchor="end" font-family="${FONT}" font-size="17" font-weight="500" fill="${p.muted}">${escapeXml(score.label)}</text>`,
  );
}

/** The card that completes the top-five grid and opens the full leaderboard. */
export function browseCardSvg(count: number, theme: Appearance): string {
  const p = palette(theme);
  return frame(
    theme,
    `<g fill="none" stroke="${p.accent}" stroke-width="3.5" stroke-linecap="round">
<path d="M22 28h6m8 0h22M22 40h6m8 0h22M22 52h6m8 0h22"/>
<path d="M306 168h30m-12-12 12 12-12 12" stroke-linejoin="round"/>
</g>
<text x="20" y="114" font-family="${FONT}" font-size="25" font-weight="600" fill="${p.text}">All ${count} models</text>
<text x="20" y="142" font-family="${FONT}" font-size="17" fill="${p.muted}">Browse the full leaderboard</text>`,
  );
}
