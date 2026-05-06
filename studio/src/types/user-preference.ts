/**
 * Current user preference payload exposed by the Studio API.
 */
export interface UserPreferences {
  /**
   * Pinned digital human identifiers in sidebar display order.
   */
  pinned_digital_human_ids: string[];
}

/**
 * Request body used to replace the pinned digital human list.
 */
export interface PutUserPreferencesRequest {
  /**
   * Complete pinned digital human identifiers list in display order.
   */
  pinned_digital_human_ids: unknown[];
}
