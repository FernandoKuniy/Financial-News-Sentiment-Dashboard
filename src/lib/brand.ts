/**
 * The FNS mark: a globe with the initials knocked out of a band across its equator.
 *
 * It lives here as geometry rather than a checked-in image so the browser tab icon, the iOS
 * home-screen icon, the social card and the header all draw the same shape from one source.
 * `next/og` rasterises the first three to PNG at build time, and it reads SVG through a data
 * URI, which is why the mark is built as a string here and not as JSX.
 *
 * Indigo is the only colour the brand uses. Green and red are spoken for everywhere else in
 * this app: they mean a headline scored positive or negative. A brand colour drawn from that
 * pair would collide with the data on every screen, so the mark stays out of it.
 */

export const BRAND = {
  ink: "#0a0a0a", // page background in dark mode, and the social card's background
  tile: "#18181b", // the mark's rounded square (zinc-900), and the knocked-out letters
  line: "#818cf8", // the globe and the band (indigo-400)
  spark: "#c7d2fe", // indigo-200, for the finer of two shapes when a mark needs one
  text: "#fafafa",
  muted: "#a1a1aa", // zinc-400
} as const;

/**
 * The mark is drawn on a 64 grid rather than the 32 the tile itself uses. A globe needs a rim,
 * a meridian and two parallels, and at 32 units those four lines have nowhere to sit without
 * touching. Doubling the grid buys the resolution; nothing else changes.
 */
export const MARK_VIEWBOX = "0 0 64 64";
/** Default corner rounding for the tile, on the 64-unit grid (rx 7 of 32 doubled). */
export const MARK_RADIUS = 14;

const CX = 32;
const CY = 32;
const GLOBE_R = 25;
/** Parallels sit this far above and below the equator. */
const PARALLEL_Y = 13;
/** Where those parallels meet the rim, so they stop at the circle instead of overshooting. */
const PARALLEL_X = Math.sqrt(GLOBE_R * GLOBE_R - PARALLEL_Y * PARALLEL_Y);

export const GLOBE_STROKE = 4.5;
/** The globe carries a little more weight when it stands alone, with no band to anchor it. */
export const GLOBE_STROKE_SOLO = 5;

export const BAND = { x: 7, y: 22, width: 50, height: 20, rx: 6 } as const;

/**
 * The letters, as centrelines on their own 22-unit cap height, stroked at weight 6.
 *
 * The S is a cubic spine, not two arcs. Two 270-degree ellipse arcs meeting at a horizontal
 * tangent are geometrically a pair of kissing rings, and that is exactly how they render: the
 * word reads FN8 at every size. A spine with open terminals and a real diagonal through the
 * waist is the only version that survives being shrunk.
 */
const LETTER_STROKE = 6;
export const LETTER_PATHS = [
  "M22 8.5L8.5 8.5L8.5 23.5", // F: top arm and stem, one rounded corner
  "M8.5 16H20", // F: crossbar
  "M31.5 23.5L31.5 8.5L45.5 23.5L45.5 8.5", // N
  "M67.45 10.6C63.45 7.4 54.5 8.2 54.5 12.3C54.5 15.9 68 15.7 68 19.5C68 23.6 59.05 24.6 55.05 21.4", // S
] as const;

/**
 * Places the 22-cap letters into the band at cap height 14, centred, with 3 units of clearance
 * on every side. Precomputed rather than derived at call time so the numbers stay inspectable.
 */
const LETTER_TRANSFORM = "translate(6.5 21.3333) scale(0.666667)";

const ROUND = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';

function globeShapes(stroke: number): string {
  return [
    `<circle cx="${CX}" cy="${CY}" r="${GLOBE_R}" fill="none" stroke="${BRAND.line}" stroke-width="${stroke}"/>`,
    `<ellipse cx="${CX}" cy="${CY}" rx="10.5" ry="${GLOBE_R}" fill="none" stroke="${BRAND.line}" stroke-width="${stroke}"/>`,
    `<path d="M${CX - PARALLEL_X} ${CY - PARALLEL_Y}H${CX + PARALLEL_X}M${CX - PARALLEL_X} ${CY + PARALLEL_Y}H${CX + PARALLEL_X}" stroke="${BRAND.line}" stroke-width="${stroke}" ${ROUND}/>`,
  ].join("");
}

function wordShapes(): string {
  const letters = LETTER_PATHS.map(
    (d) => `<path d="${d}" stroke="${BRAND.tile}" stroke-width="${LETTER_STROKE}" ${ROUND}/>`,
  ).join("");
  return [
    `<rect x="${BAND.x}" y="${BAND.y}" width="${BAND.width}" height="${BAND.height}" rx="${BAND.rx}" fill="${BRAND.line}"/>`,
    `<g transform="${LETTER_TRANSFORM}">${letters}</g>`,
  ].join("");
}

/** Everything inside the tile, with or without the word. Shared by the SVG string and the JSX. */
export function markContents(withWord: boolean): string {
  return withWord
    ? globeShapes(GLOBE_STROKE) + wordShapes()
    : globeShapes(GLOBE_STROKE_SOLO);
}

export type MarkOptions = {
  /** Rounds the tile's corners. Pass 0 for iOS, which masks the icon into its own shape and
   *  leaves a dark halo in the corners if we round it first. */
  radius?: number;
  /** Draw the initials. Below about 40px each letter lands on three device pixels and the word
   *  turns to mush, so the small sizes take the globe on its own. */
  withWord?: boolean;
};

export function markSvg(size: number, { radius = MARK_RADIUS, withWord = true }: MarkOptions = {}): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${MARK_VIEWBOX}">`,
    `<rect width="64" height="64" rx="${radius}" fill="${BRAND.tile}"/>`,
    markContents(withWord),
    `</svg>`,
  ].join("");
}

/** The same mark as a data URI, the form `next/og` can draw. */
export function markDataUri(size: number, options?: MarkOptions): string {
  return `data:image/svg+xml;base64,${Buffer.from(markSvg(size, options)).toString("base64")}`;
}
