import { ImageResponse } from "next/og";

import { markDataUri } from "@/lib/brand";

// The browser tab icon. Next renders this once at build time and serves the PNG.
//
// No initials here. A tab draws this at 16px, where each of the three letters lands on about
// three device pixels and the word reads as a smudge. The globe on its own stays legible.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundImage: `url("${markDataUri(size.width, { withWord: false })}")`,
          backgroundSize: `${size.width}px ${size.height}px`,
        }}
      />
    ),
    size,
  );
}
