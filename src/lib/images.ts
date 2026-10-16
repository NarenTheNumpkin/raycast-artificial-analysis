import { environment, Color, type Image } from "@raycast/api";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { monogramSvg } from "./cards";
import { providerAsset } from "./providers";

export function svgImage(svg: string): string {
  const directory = path.join(environment.supportPath, "cards");
  mkdirSync(directory, { recursive: true });
  const filename = path.join(directory, `${createHash("sha256").update(svg).digest("hex").slice(0, 24)}.svg`);
  if (!existsSync(filename)) writeFileSync(filename, svg, "utf8");
  return filename;
}

export function logoSvg(creator: string): string {
  const asset = providerAsset(creator);
  return asset
    ? readFileSync(path.join(environment.assetsPath, asset), "utf8")
    : monogramSvg(creator, environment.appearance);
}

export function providerIcon(creator: string): Image.ImageLike {
  const asset = providerAsset(creator);
  return asset
    ? { source: asset, tintColor: Color.PrimaryText }
    : svgImage(monogramSvg(creator, environment.appearance));
}
