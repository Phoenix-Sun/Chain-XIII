import { describe, expect, it } from "vitest";
import { createEmptyMeta, createSaveEnvelope, parseSave, serializeSave } from "./save";

describe("versioned save envelope", () => {
  it("round trips through JSON without UI state", () => {
    const save = createSaveEnvelope(createEmptyMeta(), undefined, "2026-08-24T00:00:00.000Z");
    expect(parseSave(serializeSave(save))).toEqual(save);
  });

  it("rejects unknown versions and malformed metadata", () => {
    expect(() => parseSave(JSON.stringify({ saveVersion: 99 }))).toThrow("不支援的 saveVersion");
    expect(() => parseSave(JSON.stringify({ saveVersion: 1, meta: {}, lastUpdatedAt: "now" }))).toThrow("Save meta 欄位無效");
  });
});
