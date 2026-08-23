import { MARK_RADIUS, MARK_VIEWBOX, BRAND, markContents } from "@/lib/brand";

/**
 * The FNS mark, rendered inline for the header.
 *
 * Inline SVG rather than an <img> pointing at /icon: it is a few hundred bytes in the HTML with
 * no second request, and it stays crisp at any size.
 *
 * The shapes come from `markContents` as a string rather than being retyped as JSX. Rebuilding
 * a circle, an ellipse, two parallels, a band and four letter paths by hand here would mean two
 * copies of the same geometry drifting apart on the next tweak. The string is assembled from
 * module constants with nothing user-supplied in it, so there is nothing to inject.
 *
 * Decorative, so it is hidden from assistive tech: the words beside it already say the name.
 */
export function BrandMark({
  size = 26,
  withWord = false,
}: {
  size?: number;
  /** The initials only survive at around 40px and up. The header sits well below that. */
  withWord?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={MARK_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <rect width="64" height="64" rx={MARK_RADIUS} fill={BRAND.tile} />
      <g dangerouslySetInnerHTML={{ __html: markContents(withWord) }} />
    </svg>
  );
}
