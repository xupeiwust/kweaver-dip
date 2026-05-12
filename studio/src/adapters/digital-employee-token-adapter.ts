import type { Pool, RowDataPacket } from "mysql2/promise";

/**
 * Port used to read and write digital employee RDS data.
 */
export interface DigitalEmployeeTokenAdapter {
  /**
   * Finds the application account id for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @returns The application account id when present, otherwise `undefined`.
   */
  findAppId(agentId: string): Promise<string | undefined>;

  /**
   * Finds the KWeaver token for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @returns The token when present, otherwise `undefined`.
   */
  findKweaverToken(agentId: string): Promise<string | undefined>;

  /**
   * Finds the BKN scope for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @returns The comma-separated BKN id list when present, otherwise `undefined`.
   */
  findBknScope(agentId: string): Promise<string | undefined>;

  /**
   * Writes or replaces the digital employee record.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @param appId Application account id to store, or `null` when not configured.
   * @param token KWeaver token to store, or `null` when not configured.
   * @param bknScope Comma-separated BKN id list to store, or `null` when not configured.
   */
  upsertDigitalEmployee(
    agentId: string,
    appId: string | null,
    token: string | null,
    bknScope: string | null
  ): Promise<void>;

  /**
   * Writes or replaces the application account id for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @param appId Application account id to store, or `null` when not configured.
   */
  upsertAppId(agentId: string, appId: string | null): Promise<void>;

  /**
   * Writes or replaces the KWeaver token for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @param token KWeaver token to store, or `null` when not configured.
   */
  upsertKweaverToken(agentId: string, token: string | null): Promise<void>;

  /**
   * Writes or replaces the BKN scope for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @param bknScope Comma-separated BKN id list to store, or `null` when not configured.
   */
  upsertBknScope(agentId: string, bknScope: string | null): Promise<void>;

  /**
   * Removes the KWeaver token for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   */
  deleteKweaverToken(agentId: string): Promise<void>;

  /**
   * Marks one digital employee as deleted.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   */
  markDigitalEmployeeDeleted(agentId: string): Promise<void>;
}

interface DigitalEmployeeTokenRow extends RowDataPacket {
  kweaver_token: string | null;
}

interface DigitalEmployeeAppIdRow extends RowDataPacket {
  app_id: string | null;
}

interface DigitalEmployeeBknScopeRow extends RowDataPacket {
  bkn_scope: string | null;
}

/**
 * Adapter that exposes digital employee persistence to application logic.
 */
export class DefaultDigitalEmployeeTokenAdapter implements DigitalEmployeeTokenAdapter {
  /**
   * Creates the adapter.
   *
   * @param pool MariaDB connection pool.
   */
  public constructor(private readonly pool: Pool) {}

  /**
   * Finds the application account id for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @returns The application account id when present, otherwise `undefined`.
   */
  public async findAppId(agentId: string): Promise<string | undefined> {
    const [rows] = await this.pool.execute<DigitalEmployeeAppIdRow[]>(
      [
        "SELECT app_id FROM t_digital_employee",
        "WHERE id = :agentId AND is_deleted = FALSE",
        "LIMIT 1"
      ].join(" "),
      { agentId }
    );
    const appId = rows[0]?.app_id;

    return appId === null ? undefined : appId;
  }

  /**
   * Finds the KWeaver token for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @returns The token when present, otherwise `undefined`.
   */
  public async findKweaverToken(agentId: string): Promise<string | undefined> {
    const [rows] = await this.pool.execute<DigitalEmployeeTokenRow[]>(
      [
        "SELECT kweaver_token FROM t_digital_employee",
        "WHERE id = :agentId AND is_deleted = FALSE",
        "LIMIT 1"
      ].join(" "),
      { agentId }
    );
    const token = rows[0]?.kweaver_token;

    return token === null ? undefined : token;
  }

  /**
   * Finds the BKN scope for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @returns The comma-separated BKN id list when present, otherwise `undefined`.
   */
  public async findBknScope(agentId: string): Promise<string | undefined> {
    const [rows] = await this.pool.execute<DigitalEmployeeBknScopeRow[]>(
      [
        "SELECT bkn_scope FROM t_digital_employee",
        "WHERE id = :agentId AND is_deleted = FALSE",
        "LIMIT 1"
      ].join(" "),
      { agentId }
    );
    const bknScope = rows[0]?.bkn_scope;

    return bknScope === null ? undefined : bknScope;
  }

  /**
   * Writes or replaces the digital employee record.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @param appId Application account id to store, or `null` when not configured.
   * @param token KWeaver token to store, or `null` when not configured.
   * @param bknScope Comma-separated BKN id list to store, or `null` when not configured.
   */
  public async upsertDigitalEmployee(
    agentId: string,
    appId: string | null,
    token: string | null,
    bknScope: string | null
  ): Promise<void> {
    await this.pool.execute(
      [
        "INSERT INTO t_digital_employee (id, app_id, kweaver_token, bkn_scope, is_deleted)",
        "VALUES (:agentId, :appId, :token, :bknScope, FALSE)",
        "ON DUPLICATE KEY UPDATE",
        "app_id = VALUES(app_id),",
        "kweaver_token = VALUES(kweaver_token),",
        "bkn_scope = VALUES(bkn_scope),",
        "is_deleted = FALSE"
      ].join(" "),
      { agentId, appId, token, bknScope }
    );
  }

  /**
   * Writes or replaces the application account id for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @param appId Application account id to store, or `null` when not configured.
   */
  public async upsertAppId(
    agentId: string,
    appId: string | null
  ): Promise<void> {
    await this.pool.execute(
      [
        "INSERT INTO t_digital_employee (id, app_id, is_deleted)",
        "VALUES (:agentId, :appId, FALSE)",
        "ON DUPLICATE KEY UPDATE",
        "app_id = VALUES(app_id),",
        "is_deleted = FALSE"
      ].join(" "),
      { agentId, appId }
    );
  }

  /**
   * Writes or replaces the KWeaver token for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @param token KWeaver token to store, or `null` when not configured.
   */
  public async upsertKweaverToken(
    agentId: string,
    token: string | null
  ): Promise<void> {
    await this.pool.execute(
      [
        "INSERT INTO t_digital_employee (id, kweaver_token, is_deleted)",
        "VALUES (:agentId, :token, FALSE)",
        "ON DUPLICATE KEY UPDATE",
        "kweaver_token = VALUES(kweaver_token),",
        "is_deleted = FALSE"
      ].join(" "),
      { agentId, token }
    );
  }

  /**
   * Writes or replaces the BKN scope for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   * @param bknScope Comma-separated BKN id list to store, or `null` when not configured.
   */
  public async upsertBknScope(
    agentId: string,
    bknScope: string | null
  ): Promise<void> {
    await this.pool.execute(
      [
        "INSERT INTO t_digital_employee (id, bkn_scope, is_deleted)",
        "VALUES (:agentId, :bknScope, FALSE)",
        "ON DUPLICATE KEY UPDATE",
        "bkn_scope = VALUES(bkn_scope),",
        "is_deleted = FALSE"
      ].join(" "),
      { agentId, bknScope }
    );
  }

  /**
   * Removes the KWeaver token for one digital employee.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   */
  public async deleteKweaverToken(agentId: string): Promise<void> {
    await this.pool.execute(
      [
        "UPDATE t_digital_employee",
        "SET app_id = NULL, kweaver_token = NULL, bkn_scope = NULL",
        "WHERE id = :agentId"
      ].join(" "),
      { agentId }
    );
  }

  /**
   * Marks one digital employee as deleted.
   *
   * @param agentId Digital employee id, equal to the OpenClaw agent id.
   */
  public async markDigitalEmployeeDeleted(agentId: string): Promise<void> {
    await this.pool.execute(
      "UPDATE t_digital_employee SET is_deleted = TRUE WHERE id = :agentId",
      { agentId }
    );
  }
}
