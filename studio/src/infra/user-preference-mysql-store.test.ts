import { describe, expect, it } from "vitest";

import {
  mergePreferenceContent,
  parsePreferenceContent,
  PINNED_DIGITAL_HUMAN_IDS_KEY,
  readPinnedDigitalHumanIds
} from "./user-preference-mysql-store";

describe("parsePreferenceContent", () => {
  it("returns an empty object for missing or invalid content", () => {
    expect(parsePreferenceContent(undefined)).toEqual({});
    expect(parsePreferenceContent(null)).toEqual({});
    expect(parsePreferenceContent("")).toEqual({});
    expect(parsePreferenceContent("[]")).toEqual({});
    expect(parsePreferenceContent("{bad json")).toEqual({});
  });

  it("returns a parsed object for valid JSON content", () => {
    expect(
      parsePreferenceContent(
        JSON.stringify({
          [PINNED_DIGITAL_HUMAN_IDS_KEY]: ["dh-1"]
        })
      )
    ).toEqual({
      [PINNED_DIGITAL_HUMAN_IDS_KEY]: ["dh-1"]
    });
  });
});

describe("readPinnedDigitalHumanIds", () => {
  it("returns an empty array when the key is absent or invalid", () => {
    expect(readPinnedDigitalHumanIds({})).toEqual([]);
    expect(readPinnedDigitalHumanIds({ [PINNED_DIGITAL_HUMAN_IDS_KEY]: "bad" })).toEqual([]);
  });

  it("normalizes non-empty identifier strings", () => {
    expect(
      readPinnedDigitalHumanIds({
        [PINNED_DIGITAL_HUMAN_IDS_KEY]: [" dh-1 ", "", "dh-2"]
      })
    ).toEqual(["dh-1", "dh-2"]);
  });
});

describe("mergePreferenceContent", () => {
  it("preserves unrelated keys while replacing pinned ids", () => {
    expect(
      mergePreferenceContent(
        {
          theme: "dark",
          [PINNED_DIGITAL_HUMAN_IDS_KEY]: ["old"]
        },
        {
          pinned_digital_human_ids: ["dh-1", "dh-2"]
        }
      )
    ).toEqual({
      theme: "dark",
      [PINNED_DIGITAL_HUMAN_IDS_KEY]: ["dh-1", "dh-2"]
    });
  });
});
