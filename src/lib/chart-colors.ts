"use client";

import { useEffect, useState } from "react";

/**
 * Recharts needs real colour values. It writes `fill` and `stroke` as SVG attributes, and
 * `var(--x)` is not valid in an attribute, so the palette cannot simply be passed through as a
 * Tailwind class the way the rest of the app does it.
 *
 * Rather than keep a second copy of the hexes in TypeScript, this reads the same custom
 * properties globals.css already defines. One place to change a colour, and the tooltip and
 * legend swatches get the same value as the series they describe.
 *
 * Reading happens after mount because it needs a real element to compute against. That costs
 * nothing here: the charts only exist once the analysis has come back, which is well after
 * hydration, so there is no server render of them to mismatch.
 */
const VARS = {
  positive: "--sentiment-positive",
  neutral: "--sentiment-neutral",
  negative: "--sentiment-negative",
  price: "--chart-price",
  grid: "--chart-grid",
  axis: "--chart-axis",
} as const;

export type ChartColors = Record<keyof typeof VARS, string>;

function readChartColors(): ChartColors {
  const style = getComputedStyle(document.documentElement);
  const entries = Object.entries(VARS).map(([key, prop]) => [key, style.getPropertyValue(prop).trim()]);
  return Object.fromEntries(entries) as ChartColors;
}

/** Null until the first read lands, so a caller can hold the frame rather than guess a palette. */
export function useChartColors(): ChartColors | null {
  const [colors, setColors] = useState<ChartColors | null>(null);

  useEffect(() => {
    const apply = () => setColors(readChartColors());
    apply();
    // No toggle in this app, but the OS setting can flip while a chart is on screen.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return colors;
}
