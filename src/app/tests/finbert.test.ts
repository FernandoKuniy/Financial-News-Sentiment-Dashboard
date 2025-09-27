import { describe, it, expect } from "vitest";
import { mapFinBertLabel } from "@/lib/finbert";


describe("mapFinBertLabel", () => {
it("maps positive variants", () => {
expect(mapFinBertLabel("positive")).toBe("positive");
expect(mapFinBertLabel("POS")).toBe("positive");
});
it("maps neutral variants", () => {
expect(mapFinBertLabel("NEUtral")).toBe("neutral");
expect(mapFinBertLabel("neu")).toBe("neutral");
});
it("defaults to negative", () => {
expect(mapFinBertLabel("negative")).toBe("negative");
expect(mapFinBertLabel("NEG")).toBe("negative");
expect(mapFinBertLabel("unknown-label")).toBe("negative");
});
});