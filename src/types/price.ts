export type PricePoint = { date: string; close: number };
export type PriceResponse = {
  q: string;
  range: "7d" | "14d" | "30d";
  items: PricePoint[];
};
