import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";

import type { UserPreferenceStore } from "../logic/user-preference";
import type { UserPreferences } from "../types/user-preference";

/**
 * JSON content key used to store pinned digital human identifiers.
 */
export const PINNED_DIGITAL_HUMAN_IDS_KEY = "pinned_digital_human_ids";
export const STUDIO_USER_PREFERENCE_TABLE = "t_studio_user_preference";

/**
 * Static database connection settings for the Studio user preference store.
 */
export interface UserPreferenceMysqlStoreOptions {
  /**
   * Database host name.
   */
  host: string;

  /**
   * Database port number.
   */
  port: number;

  /**
   * Database user name.
   */
  user: string;

  /**
   * Database user password.
   */
  password: string;

  /**
   * Database schema name.
   */
  database: string;
}

/**
 * Database row shape for the user preference table.
 */
interface UserPreferenceRow extends RowDataPacket {
  /**
   * JSON-encoded preference content.
   */
  content: string | null;
}

/**
 * MySQL-backed implementation of the Studio user preference store.
 */
export class DefaultUserPreferenceMysqlStore implements UserPreferenceStore {
  /**
   * Shared connection pool.
   */
  private readonly pool: Pool;

  /**
   * Creates the store with one MySQL connection pool.
   *
   * @param options Static database connection options.
   */
  public constructor(options: UserPreferenceMysqlStoreOptions) {
    this.pool = createPool({
      host: options.host,
      port: options.port,
      user: options.user,
      password: options.password,
      database: options.database,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60_000,
      queueLimit: 0
    });
  }

  /**
   * Reads one user's stored preference snapshot.
   *
   * @param userId Authenticated user identifier.
   * @returns The stored preference snapshot or an empty default.
   */
  public async getByUserId(userId: string): Promise<UserPreferences> {
    const [rows] = await this.pool.query<UserPreferenceRow[]>(
      `SELECT content FROM ${STUDIO_USER_PREFERENCE_TABLE} WHERE user_id = ?`,
      [userId]
    );
    const content = parsePreferenceContent(rows[0]?.content);

    return {
      pinned_digital_human_ids: readPinnedDigitalHumanIds(content)
    };
  }

  /**
   * Replaces one user's pinned digital human preference field while preserving
   * any unrelated keys already stored in the JSON content document.
   *
   * @param userId Authenticated user identifier.
   * @param preference Normalized preference payload.
   */
  public async upsert(userId: string, preference: UserPreferences): Promise<void> {
    const [rows] = await this.pool.query<UserPreferenceRow[]>(
      `SELECT content FROM ${STUDIO_USER_PREFERENCE_TABLE} WHERE user_id = ?`,
      [userId]
    );
    const mergedContent = mergePreferenceContent(
      parsePreferenceContent(rows[0]?.content),
      preference
    );

    await this.pool.query(
      [
        `INSERT INTO ${STUDIO_USER_PREFERENCE_TABLE} (user_id, content)`,
        "VALUES (?, ?)",
        "ON DUPLICATE KEY UPDATE content = VALUES(content)"
      ].join(" "),
      [userId, JSON.stringify(mergedContent)]
    );
  }
}

/**
 * Parses one stored JSON preference document into an object shape.
 *
 * @param rawContent Raw database value.
 * @returns A safe object representation.
 */
export function parsePreferenceContent(rawContent: string | null | undefined): Record<string, unknown> {
  if (rawContent === undefined || rawContent === null || rawContent.trim() === "") {
    return {};
  }

  try {
    const parsed = JSON.parse(rawContent) as unknown;

    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }

    return {};
  } catch {
    return {};
  }
}

/**
 * Reads the pinned digital human identifiers from one parsed preference object.
 *
 * @param content Parsed JSON preference content.
 * @returns The normalized identifiers list.
 */
export function readPinnedDigitalHumanIds(content: Record<string, unknown>): string[] {
  const rawIds = content[PINNED_DIGITAL_HUMAN_IDS_KEY];

  if (!Array.isArray(rawIds)) {
    return [];
  }

  const normalized: string[] = [];

  for (const item of rawIds) {
    const digitalHumanId = String(item).trim();

    if (digitalHumanId.length > 0) {
      normalized.push(digitalHumanId);
    }
  }

  return normalized;
}

/**
 * Merges one normalized preference snapshot into an existing JSON document.
 *
 * @param existingContent Existing parsed JSON document.
 * @param preference Normalized preference snapshot.
 * @returns The merged JSON document ready for persistence.
 */
export function mergePreferenceContent(
  existingContent: Record<string, unknown>,
  preference: UserPreferences
): Record<string, unknown> {
  return {
    ...existingContent,
    [PINNED_DIGITAL_HUMAN_IDS_KEY]: [...preference.pinned_digital_human_ids]
  };
}
