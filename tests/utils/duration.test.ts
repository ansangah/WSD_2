import { describe, it, expect } from "vitest";
import { durationToSeconds } from "@utils/duration";

describe("durationToSeconds", () => {
  it("parses minute strings", () => {
    expect(durationToSeconds("15m")).toBe(900);
  });

  it("parses hour strings", () => {
    expect(durationToSeconds("2h")).toBe(7200);
  });

  it("falls back for invalid input", () => {
    expect(durationToSeconds("invalid")).toBe(900);
  });
});
