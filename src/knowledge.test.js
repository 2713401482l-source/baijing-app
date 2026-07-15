import { describe, expect, it } from "vitest";
import { knowledgeTopics } from "./data.js";

describe("psychology library content", () => {
  it("keeps all 24 topics complete for both reading depths", () => {
    const entries = knowledgeTopics.flatMap((topic) => topic.items);

    expect(entries).toHaveLength(24);
    for (const entry of entries) {
      expect(entry.summary).toBeTruthy();
      expect(entry.signs?.length).toBeGreaterThan(0);
      expect(entry.practice).toBeTruthy();
      expect(entry.myth).toBeTruthy();
      expect(entry.mechanism).toBeTruthy();
      expect(entry.boundary).toBeTruthy();
      expect(entry.evidence).toBeTruthy();
      expect(entry.source).toBeTruthy();
    }
  });
});
