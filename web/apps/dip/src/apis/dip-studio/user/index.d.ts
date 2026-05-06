/** Studio 用户偏好 */
export interface UserPreferences {
  /** 侧栏固定的数字员工 ID，顺序即展示顺序 */
  pinned_digital_human_ids: string[]
}

/** PUT /user/preferences 请求体 */
export type UserPreferencesPutBody = UserPreferences
