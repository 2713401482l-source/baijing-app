import { describe, expect, it } from "vitest";
import { encounterTracks } from "./data.js";

describe("声音盲盒内容目录", () => {
  it("提供六种本地自然声且全部可以循环", () => {
    const natureTracks = encounterTracks.filter((track) => track.category === "nature");
    expect(natureTracks).toHaveLength(6);
    expect(natureTracks.every((track) => track.src.startsWith("audio/encounter/") && track.src.endsWith(".mp3"))).toBe(true);
    expect(natureTracks.every((track) => track.loop && track.detail)).toBe(true);
  });

  it("不再暴露旧的纯噪声条目", () => {
    expect(encounterTracks.some((track) => track.category === "noise")).toBe(false);
    expect(encounterTracks.some((track) => /白噪|灰噪/.test(track.title))).toBe(false);
  });
});
