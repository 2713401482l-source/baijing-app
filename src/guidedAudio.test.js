import { describe, expect, it, vi } from "vitest";
import { createGuidedAudioPool, getGuidedAudioUrl } from "./guidedAudio.js";

class FakeAudio {
  constructor(src) {
    this.src = src;
    this.currentTime = 9;
    this.readyState = 0;
    this.load = vi.fn();
    this.pause = vi.fn();
    this.play = vi.fn(() => Promise.resolve());
  }
}

describe("引导音频预载池", () => {
  it("在 GitHub Pages 子路径下生成正确地址", () => {
    expect(getGuidedAudioUrl("/audio/rumination.mp3", "/weiding-app/"))
      .toBe("/weiding-app/audio/rumination.mp3");
  });

  it("为同一音频复用实例并提前加载完整媒体", () => {
    const created = [];
    const pool = createGuidedAudioPool({
      baseUrl: "/weiding-app/",
      createAudio: (url) => {
        const audio = new FakeAudio(url);
        created.push(audio);
        return audio;
      },
    });

    const first = pool.prepare("/audio/rumination.mp3", 0.7);
    const second = pool.prepare("/audio/rumination.mp3", 0.5);

    expect(first).toBe(second);
    expect(created).toHaveLength(1);
    expect(first.element.preload).toBe("auto");
    expect(first.element.load).toHaveBeenCalledOnce();
    expect(first.element.volume).toBe(0.5);
  });

  it("重新进入场景页时从头准备音频", () => {
    const pool = createGuidedAudioPool({ createAudio: (url) => new FakeAudio(url) });
    const entry = pool.reset("/audio/blocked.mp3", 0.8);

    expect(entry.element.pause).toHaveBeenCalledOnce();
    expect(entry.element.currentTime).toBe(0);
    expect(entry.element.load).toHaveBeenCalledTimes(2);
  });
});
