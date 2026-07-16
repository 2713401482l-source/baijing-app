import { describe, expect, it } from "vitest";
import { clampVolume, isSamsungBrowser, railProfiles } from "./audioFeedback.js";

describe("shared audio feedback profiles", () => {
  it("clamps stored and user-provided volume safely", () => {
    expect(clampVolume(1.8)).toBe(1);
    expect(clampVolume(-0.4)).toBe(0);
    expect(clampVolume("0.75")).toBe(0.75);
    expect(clampVolume(undefined)).toBe(0.82);
  });

  it("keeps each state audible long enough for mobile speakers", () => {
    expect(railProfiles).toHaveLength(6);
    expect(railProfiles.every((profile) => profile.duration >= 0.08)).toBe(true);
    expect(new Set(railProfiles.map((profile) => profile.frequency)).size).toBe(6);
  });

  it("routes Samsung Internet through the HTML audio fallback", () => {
    expect(isSamsungBrowser("Mozilla/5.0 SamsungBrowser/28.0 Chrome/130.0 Mobile")).toBe(true);
    expect(isSamsungBrowser("Mozilla/5.0 CriOS/130.0 Mobile")).toBe(false);
  });
});
