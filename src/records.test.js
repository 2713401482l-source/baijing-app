import { describe, expect, it } from "vitest";
import { createMeditationRecord, getFeedbackLabel, getRecordScene, getRecordSummary, getRecordTitle } from "./records.js";

describe("状态记录", () => {
  it("为新记录保存场景、时长和稳定的生成标题", () => {
    const record = createMeditationRecord({
      id: "record-1",
      stateId: "rumination",
      sceneIndex: 0,
      feedback: "steadier",
      duration: 315.4,
      at: "2026-07-17T08:00:00.000Z",
    });
    expect(record.duration).toBe(315);
    expect(record.sceneIndex).toBe(0);
    expect(getRecordTitle(record)).toBe(record.title);
    expect(getRecordScene(record)).toBe("一段对话总在脑中重播。");
  });

  it("兼容旧记录并提供默认摘要", () => {
    const legacy = { type: "meditation", stateId: "blocked", feedback: "same", at: "2026-07-17T09:00:00.000Z" };
    expect(getRecordTitle(legacy)).not.toBe("难以启动");
    expect(getRecordSummary(legacy)).toContain("没有明显变化");
    expect(getFeedbackLabel(legacy.feedback)).toBe("没有明显变化");
  });

  it("优先展示用户自己写下的文字", () => {
    expect(getRecordSummary({ note: "  我想记住这次的呼吸。  " })).toBe("我想记住这次的呼吸。");
  });
});
