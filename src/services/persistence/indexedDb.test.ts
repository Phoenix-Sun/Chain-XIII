import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { createSaveEnvelope } from "../../domain/save";
import { deleteFromIndexedDb, loadFromIndexedDb, saveToIndexedDb } from "./indexedDb";

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase("chain-xiii");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB delete blocked"));
  });
}

describe("IndexedDB persistence", () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  it("writes, loads, and deletes a versioned save envelope", async () => {
    const save = createSaveEnvelope(undefined, undefined, "2026-08-25T00:00:00.000Z");
    await saveToIndexedDb("default", save);
    expect(await loadFromIndexedDb("default")).toEqual(save);
    await deleteFromIndexedDb("default");
    expect(await loadFromIndexedDb("default")).toBeNull();
  });

  it("serializes rapid writes so the newest snapshot remains last", async () => {
    const first = createSaveEnvelope({ ...createSaveEnvelope().meta, crystals: 10 }, undefined, "2026-08-25T00:00:01.000Z");
    const second = createSaveEnvelope({ ...createSaveEnvelope().meta, crystals: 20 }, undefined, "2026-08-25T00:00:02.000Z");
    await Promise.all([saveToIndexedDb("default", first), saveToIndexedDb("default", second)]);
    expect((await loadFromIndexedDb("default"))?.meta.crystals).toBe(20);
  });
});
