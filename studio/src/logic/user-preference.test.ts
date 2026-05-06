import { describe, expect, it } from "vitest";

import { HttpError } from "../errors/http-error";
import {
  DefaultUserPreferenceLogic,
  MAX_PINNED_DIGITAL_HUMANS,
  MAX_PINNED_DIGITAL_HUMAN_ID_LENGTH,
  normalizePinnedDigitalHumanIds,
  type UserPreferenceStore
} from "./user-preference";

/**
 * In-memory preference store used by user preference logic tests.
 */
class MemoryUserPreferenceStore implements UserPreferenceStore {
  /**
   * Captures persisted snapshots by user id.
   */
  public readonly values = new Map<string, { pinned_digital_human_ids: string[] }>();

  /**
   * Reads one user's stored snapshot.
   *
   * @param userId Authenticated user identifier.
   * @returns The stored snapshot or an empty default.
   */
  public async getByUserId(userId: string) {
    return this.values.get(userId) ?? { pinned_digital_human_ids: [] };
  }

  /**
   * Replaces one user's stored snapshot.
   *
   * @param userId Authenticated user identifier.
   * @param preference Normalized preference payload.
   */
  public async upsert(userId: string, preference: { pinned_digital_human_ids: string[] }) {
    this.values.set(userId, {
      pinned_digital_human_ids: [...preference.pinned_digital_human_ids]
    });
  }
}

describe("normalizePinnedDigitalHumanIds", () => {
  it("trims values, preserves order and removes duplicates", () => {
    expect(normalizePinnedDigitalHumanIds([" a ", "a", "b", "", " c "])).toEqual([
      "a",
      "b",
      "c"
    ]);
  });

  it("rejects values that exceed the id length limit", () => {
    expect(() =>
      normalizePinnedDigitalHumanIds(["x".repeat(MAX_PINNED_DIGITAL_HUMAN_ID_LENGTH + 1)])
    ).toThrow(HttpError);
  });

  it("rejects lists that exceed the sidebar limit", () => {
    expect(() =>
      normalizePinnedDigitalHumanIds(
        Array.from({ length: MAX_PINNED_DIGITAL_HUMANS + 1 }, (_, index) => `dh-${index}`)
      )
    ).toThrow(`at most ${MAX_PINNED_DIGITAL_HUMANS}`);
  });
});

describe("DefaultUserPreferenceLogic", () => {
  it("returns one user's stored preferences", async () => {
    const store = new MemoryUserPreferenceStore();
    await store.upsert("u1", {
      pinned_digital_human_ids: ["dh-1", "dh-2"]
    });
    const logic = new DefaultUserPreferenceLogic(store);

    await expect(logic.getUserPreferences("u1")).resolves.toEqual({
      pinned_digital_human_ids: ["dh-1", "dh-2"]
    });
  });

  it("normalizes and persists one user's preferences", async () => {
    const store = new MemoryUserPreferenceStore();
    const logic = new DefaultUserPreferenceLogic(store);

    await expect(
      logic.putUserPreferences("u1", {
        pinned_digital_human_ids: [" dh-1 ", "dh-1", "dh-2"]
      })
    ).resolves.toEqual({
      pinned_digital_human_ids: ["dh-1", "dh-2"]
    });

    expect(await store.getByUserId("u1")).toEqual({
      pinned_digital_human_ids: ["dh-1", "dh-2"]
    });
  });
});
