import { HttpError } from "../errors/http-error";
import type {
  PutUserPreferencesRequest,
  UserPreferences
} from "../types/user-preference";

/**
 * Maximum number of pinned digital humans rendered in the Studio sidebar.
 */
export const MAX_PINNED_DIGITAL_HUMANS = 8;

/**
 * Maximum accepted digital human identifier length.
 */
export const MAX_PINNED_DIGITAL_HUMAN_ID_LENGTH = 128;

/**
 * Persistence port for user preferences.
 */
export interface UserPreferenceStore {
  /**
   * Reads one user's current preference snapshot.
   *
   * @param userId Authenticated user identifier.
   * @returns The stored preference snapshot.
   */
  getByUserId(userId: string): Promise<UserPreferences>;

  /**
   * Replaces one user's pinned digital human preference field.
   *
   * @param userId Authenticated user identifier.
   * @param preference Normalized preference payload.
   */
  upsert(userId: string, preference: UserPreferences): Promise<void>;
}

/**
 * Business logic exposed by the Studio user preference endpoints.
 */
export interface UserPreferenceLogic {
  /**
   * Reads one user's preference snapshot.
   *
   * @param userId Authenticated user identifier.
   * @returns The stored preference snapshot.
   */
  getUserPreferences(userId: string): Promise<UserPreferences>;

  /**
   * Validates and stores one user's preference snapshot.
   *
   * @param userId Authenticated user identifier.
   * @param body Raw request payload.
   * @returns The normalized persisted snapshot.
   */
  putUserPreferences(
    userId: string,
    body: PutUserPreferencesRequest
  ): Promise<UserPreferences>;
}

/**
 * Default user preference business logic.
 */
export class DefaultUserPreferenceLogic implements UserPreferenceLogic {
  /**
   * Creates the logic with one persistence dependency.
   *
   * @param store Preference persistence port.
   */
  public constructor(private readonly store: UserPreferenceStore) {}

  /**
   * Reads one user's preference snapshot.
   *
   * @param userId Authenticated user identifier.
   * @returns The stored preference snapshot.
   */
  public async getUserPreferences(userId: string): Promise<UserPreferences> {
    return this.store.getByUserId(userId);
  }

  /**
   * Validates and stores one user's pinned digital humans preference.
   *
   * @param userId Authenticated user identifier.
   * @param body Raw request payload.
   * @returns The normalized persisted snapshot.
   */
  public async putUserPreferences(
    userId: string,
    body: PutUserPreferencesRequest
  ): Promise<UserPreferences> {
    const preference = {
      pinned_digital_human_ids: normalizePinnedDigitalHumanIds(
        body.pinned_digital_human_ids
      )
    };

    await this.store.upsert(userId, preference);

    return preference;
  }
}

/**
 * Normalizes the pinned digital human identifiers list.
 *
 * @param rawIds Raw request list.
 * @returns The normalized list with trimmed unique identifiers.
 */
export function normalizePinnedDigitalHumanIds(rawIds: readonly unknown[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const item of rawIds) {
    const digitalHumanId = String(item).trim();

    if (digitalHumanId.length === 0) {
      continue;
    }

    if (digitalHumanId.length > MAX_PINNED_DIGITAL_HUMAN_ID_LENGTH) {
      throw new HttpError(
        400,
        `digital human id must not exceed ${MAX_PINNED_DIGITAL_HUMAN_ID_LENGTH} characters`,
        "DipStudio.InvalidDigitalHumanId"
      );
    }

    if (seen.has(digitalHumanId)) {
      continue;
    }

    seen.add(digitalHumanId);
    normalized.push(digitalHumanId);

    if (normalized.length > MAX_PINNED_DIGITAL_HUMANS) {
      throw new HttpError(
        400,
        `at most ${MAX_PINNED_DIGITAL_HUMANS} pinned digital humans are allowed`,
        "DipStudio.PinnedDigitalHumanLimit"
      );
    }
  }

  return normalized;
}
