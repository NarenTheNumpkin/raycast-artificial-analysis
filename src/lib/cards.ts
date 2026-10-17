import type { Verdict } from "./compare";
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
        cell: "rgba(148,163,184,0.09)",
      }
    : {
        background: "#ffffff",
        backgroundEnd: "#f6f7f9",
        border: "#dfe3e8",
        text: "#151a23",
        muted: "#5d6878",
        accent: "#0b6bcb",
        monogram: "#e4e8ee",
        cell: "#f0f3f7",
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

/** A 360-unit-wide card with the shared background; rendered at 2x for crisp text. */
function frame(theme: Appearance, body: string, height = 202.5): string {
  const p = palette(theme);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height * 2}" viewBox="0 0 360 ${height}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.background}"/><stop offset="1" stop-color="${p.backgroundEnd}"/></linearGradient></defs>
<rect x="1" y="1" width="358" height="${height - 2}" rx="18" fill="url(#bg)" stroke="${p.border}" stroke-width="1.5"/>
${body}
</svg>`;
}

/** Places a provider logo SVG inside a card, stripping its own size so it scales into the given box. */
function embedLogo(logo: string, x: number, y: number, size: number): string {
  return logo
    .replace(/<\?xml[^>]*>/g, "")
    .replace(
      /<svg\b([^>]*)>/,
      (_match, attributes: string) =>
        `<svg${attributes.replace(/\s(?:width|height|x|y)="[^"]*"/g, "")} x="${x}" y="${y}" width="${size}" height="${size}">`,
    );
}

function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

/** The largest font size, up to `preferred`, at which `text` fits in `width` units. */
function fitFont(text: string, width: number, preferred: number, charWidth = 0.6): number {
  return Math.max(10, Math.min(preferred, Math.floor(width / (Math.max(text.length, 1) * charWidth))));
}

export function monogramSvg(creator: string, theme: Appearance): string {
  const p = palette(theme);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${p.monogram}"/><text x="32" y="41" text-anchor="middle" font-family="${FONT}" font-size="25" font-weight="700" fill="${p.text}">${escapeXml(providerInitials(creator))}</text></svg>`;
}

function labelLines(text: string, maxChars = 24, maxLines = 2): string[] {
  const words = text.split(/\s+/);
  const lines = [""];
  for (const word of words) {
    const index = lines.length - 1;
    const next = `${lines[index]} ${word}`.trim();
    if (next.length <= maxChars) lines[index] = next;
    else if (lines.length < maxLines && lines[index]) lines.push(word);
    else {
      lines[index] = truncate(next, maxChars - 1);
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
  const embedded = embedLogo(logo, 20, 18, 32);
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

export type ComparisonShape = "portrait" | "tall";

export interface ComparisonValue {
  label: string;
  value: string;
  verdict: Verdict;
}

export interface ComparisonCard {
  name: string;
  configuration: string;
  logo: string;
  values: ComparisonValue[];
}

/** Positions in card units (cards are 360 wide): portrait cards fill three columns, tall cards four. */
const COMPARISON_LAYOUTS: Record<
  ComparisonShape,
  {
    height: number;
    margin: number;
    logo: number;
    nameSize: number;
    nameChars: number;
    lineGap: number;
    /** Baseline of the name's last line; names grow upward so they always sit just above the provider line. */
    nameBottom: number;
    configSize: number;
    configChars: number;
    /** Top of the first metric tile. */
    top: number;
    gap: number;
    /** Metric tiles per row: two stacked tiles in portrait cards, one inline tile in tall cards. */
    columns: number;
    labelSize: number;
    valueSize: number;
  }
> = {
  portrait: {
    height: 480,
    margin: 22,
    logo: 40,
    nameSize: 28,
    nameChars: 20,
    lineGap: 32,
    nameBottom: 132,
    configSize: 16,
    configChars: 34,
    top: 186,
    gap: 10,
    columns: 2,
    labelSize: 16,
    valueSize: 36,
  },
  tall: {
    height: 640,
    margin: 24,
    logo: 44,
    nameSize: 30,
    nameChars: 18,
    lineGap: 34,
    nameBottom: 146,
    configSize: 18,
    configChars: 30,
    top: 206,
    gap: 8,
    columns: 1,
    labelSize: 19,
    valueSize: 34,
  },
};

function verdictColors(verdict: Verdict, theme: Appearance): { fill: string; text: string } {
  const p = palette(theme);
  const dark = theme === "dark";
  switch (verdict) {
    case "best":
      return dark ? { fill: "rgba(74,222,128,0.16)", text: "#4ade80" } : { fill: "#dcfce7", text: "#15803d" };
    case "worst":
      return dark ? { fill: "rgba(248,113,113,0.16)", text: "#f87171" } : { fill: "#fee2e2", text: "#b91c1c" };
    case "missing":
      return { fill: p.cell, text: p.muted };
    default:
      return { fill: p.cell, text: p.text };
  }
}

/**
 * A model's column in the side-by-side comparison: a large heading, then every metric in a colored tile at the
 * same position as in the other cards, so values line up across columns.
 */
export function comparisonCardSvg(card: ComparisonCard, theme: Appearance, shape: ComparisonShape): string {
  const p = palette(theme);
  const layout = COMPARISON_LAYOUTS[shape];
  const { margin, columns, gap, top } = layout;
  const lines = labelLines(card.name, layout.nameChars);
  const header = `<g fill="${p.text}" color="${p.text}">${embedLogo(card.logo, margin, margin, layout.logo)}</g>
${lines
  .map(
    (line, index) =>
      `<text x="${margin}" y="${layout.nameBottom - (lines.length - 1 - index) * layout.lineGap}" font-family="${FONT}" font-size="${layout.nameSize}" font-weight="700" fill="${p.text}">${escapeXml(line)}</text>`,
  )
  .join("\n")}
<text x="${margin}" y="${layout.nameBottom + layout.configSize + 12}" font-family="${FONT}" font-size="${layout.configSize}" fill="${p.muted}">${escapeXml(truncate(card.configuration, layout.configChars))}</text>
<line x1="${margin}" y1="${top - 12}" x2="${360 - margin}" y2="${top - 12}" stroke="${p.border}" stroke-width="1.5"/>`;
  const rows = Math.ceil(card.values.length / columns);
  const w = (360 - margin * 2 - gap * (columns - 1)) / columns;
  const h = (layout.height - top - margin + 6 - gap * (rows - 1)) / rows;
  const tiles = card.values.map((value, index) => {
    const x = margin + (index % columns) * (w + gap);
    const y = top + Math.floor(index / columns) * (h + gap);
    const colors = verdictColors(value.verdict, theme);
    const tile = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${colors.fill}"/>`;
    if (columns === 1) {
      // Label on the left and the value right-aligned on one line.
      const size = fitFont(value.value, w - 40 - value.label.length * layout.labelSize * 0.52, layout.valueSize);
      return `${tile}
<text x="${x + 16}" y="${y + h / 2 + 7}" font-family="${FONT}" font-size="${layout.labelSize}" fill="${p.muted}">${escapeXml(value.label)}</text>
<text x="${x + w - 16}" y="${y + h / 2 + size * 0.36}" text-anchor="end" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${colors.text}">${escapeXml(value.value)}</text>`;
    }
    const size = fitFont(value.value, w - 28, layout.valueSize);
    return `${tile}
<text x="${x + 14}" y="${y + layout.labelSize + 10}" font-family="${FONT}" font-size="${layout.labelSize}" fill="${p.muted}">${escapeXml(value.label)}</text>
<text x="${x + 14}" y="${y + h - 12}" font-family="${FONT}" font-size="${size}" font-weight="700" letter-spacing="-0.5" fill="${colors.text}">${escapeXml(value.value)}</text>`;
  });
  return frame(theme, `${header}\n${tiles.join("\n")}`, layout.height);
}

/** A dashed placeholder in the next empty column, inviting another model into the comparison. */
export function addModelCardSvg(theme: Appearance, shape: ComparisonShape): string {
  const p = palette(theme);
  const { height } = COMPARISON_LAYOUTS[shape];
  const scale = shape === "tall" ? 1.25 : 1;
  const center = height / 2;
  const radius = 32 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height * 2}" viewBox="0 0 360 ${height}">
<rect x="2" y="2" width="356" height="${height - 4}" rx="18" fill="none" stroke="${p.border}" stroke-width="3" stroke-dasharray="10 8"/>
<circle cx="180" cy="${center - radius}" r="${radius}" fill="none" stroke="${p.accent}" stroke-width="4"/>
<path d="M180 ${center - radius * 1.5}v${radius}M${180 - radius / 2} ${center - radius}h${radius}" stroke="${p.accent}" stroke-width="4" stroke-linecap="round"/>
<text x="180" y="${center + 40 * scale}" text-anchor="middle" font-family="${FONT}" font-size="${26 * scale}" font-weight="600" fill="${p.text}">Add a Model</text>
<text x="180" y="${center + 70 * scale}" text-anchor="middle" font-family="${FONT}" font-size="${17 * scale}" fill="${p.muted}">Up to 4 side by side</text>
</svg>`;
}
