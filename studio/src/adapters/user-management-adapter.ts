import {
  DefaultIsfHttpClient,
  type IsfHttpClient,
  type IsfHttpClientOptions,
  type IsfProxyResponse,
  type IsfQuery
} from "../infra/isf-http-client";
import { getEnv } from "../utils/env";

const USER_MANAGEMENT_APP_PAGE_LIMIT = 1000;

/**
 * Minimal application account projection used by Studio.
 */
export interface UserManagementAppInfo {
  /**
   * Application account id.
   */
  id: string;

  /**
   * Application account name.
   */
  name: string;
}

interface UserManagementAppListBody {
  entries?: unknown;
  total_count?: unknown;
}

/**
 * Adapter for ISF `/user-management` APIs used by Studio.
 */
export interface UserManagementAdapter {
  /**
   * Lists application accounts.
   *
   * @param query Incoming query parameters.
   * @param bearerToken Optional user bearer token.
   */
  listApps(query: IsfQuery, bearerToken?: string): Promise<IsfProxyResponse>;

  /**
   * Finds one application account by id using the user-management app list API.
   *
   * @param appId Application account id.
   * @param bearerToken Optional user bearer token.
   */
  findAppById(
    appId: string,
    bearerToken?: string
  ): Promise<UserManagementAppInfo | undefined>;

  /**
   * Creates one application account.
   *
   * @param body Request body.
   * @param bearerToken Optional user bearer token.
   */
  createApp(body: unknown, bearerToken?: string): Promise<IsfProxyResponse>;

  /**
   * Creates an application account token.
   *
   * @param body Request body.
   * @param bearerToken Optional user bearer token.
   */
  createAppToken(body: unknown, bearerToken?: string): Promise<IsfProxyResponse>;
}

/**
 * Factory used to create a fresh ISF HTTP client for each request.
 */
export type CreateIsfHttpClient = (options: IsfHttpClientOptions) => IsfHttpClient;

/**
 * Runtime dependencies required by {@link DefaultUserManagementAdapter}.
 */
export interface UserManagementAdapterOptions {
  /**
   * Optional env reader used to resolve current ISF client configuration.
   */
  getEnv?: typeof getEnv;

  /**
   * Optional ISF client factory.
   */
  createClient?: CreateIsfHttpClient;
}

/**
 * Default adapter implementation for `/user-management`.
 */
export class DefaultUserManagementAdapter implements UserManagementAdapter {
  private readonly getEnvValue: typeof getEnv;
  private readonly createClientValue: CreateIsfHttpClient;

  /**
   * Creates the user-management adapter.
   *
   * @param options Optional dependency overrides for tests.
   */
  public constructor(options: UserManagementAdapterOptions = {}) {
    this.getEnvValue = options.getEnv ?? getEnv;
    this.createClientValue = options.createClient ?? ((clientOptions) =>
      new DefaultIsfHttpClient(clientOptions));
  }

  /**
   * Lists application accounts.
   *
   * @param query Incoming query parameters.
   * @param bearerToken Optional user bearer token.
   * @returns The normalized upstream response.
   */
  public async listApps(
    query: IsfQuery,
    bearerToken?: string
  ): Promise<IsfProxyResponse> {
    return this.createClient().forwardRequest("/api/user-management/v1/apps", {
      method: "GET",
      query,
      bearerToken
    });
  }

  /**
   * Finds one application account by id using the paginated app list API.
   *
   * @param appId Application account id.
   * @param bearerToken Optional user bearer token.
   * @returns The matched application account projection, or `undefined`.
   */
  public async findAppById(
    appId: string,
    bearerToken?: string
  ): Promise<UserManagementAppInfo | undefined> {
    let offset = 0;

    while (true) {
      const result = await this.listApps(
        { limit: USER_MANAGEMENT_APP_PAGE_LIMIT, offset },
        bearerToken
      );
      const parsed = parseUserManagementAppList(result.body);
      const matched = parsed.entries.find((entry) => entry.id === appId);

      if (matched !== undefined) {
        return matched;
      }

      offset += parsed.entries.length;
      if (
        parsed.entries.length === 0 ||
        parsed.totalCount === undefined ||
        offset >= parsed.totalCount
      ) {
        return undefined;
      }
    }
  }

  /**
   * Creates one application account.
   *
   * @param body Request body.
   * @param bearerToken Optional user bearer token.
   * @returns The normalized upstream response.
   */
  public async createApp(
    body: unknown,
    bearerToken?: string
  ): Promise<IsfProxyResponse> {
    return this.createClient().forwardRequest("/api/user-management/v1/apps", {
      method: "POST",
      body,
      bearerToken
    });
  }

  /**
   * Creates an application account token.
   *
   * @param body Request body.
   * @param bearerToken Optional user bearer token.
   * @returns The normalized upstream response.
   */
  public async createAppToken(
    body: unknown,
    bearerToken?: string
  ): Promise<IsfProxyResponse> {
    return this.createClient().forwardRequest(
      "/api/user-management/v1/console/app-tokens",
      {
        method: "POST",
        body,
        bearerToken
      }
    );
  }

  /**
   * Builds a fresh ISF HTTP client from the current environment snapshot.
   *
   * @returns A newly created ISF HTTP client instance.
   */
  private createClient(): IsfHttpClient {
    const env = this.getEnvValue();

    return this.createClientValue({
      baseUrl: env.kweaverBaseUrl,
      timeoutMs: env.openClawGatewayTimeoutMs
    });
  }
}

/**
 * Parses the user-management application account list response.
 *
 * @param body Raw upstream JSON response body.
 * @returns Valid application accounts and total count when available.
 */
function parseUserManagementAppList(
  body: string
): { entries: UserManagementAppInfo[]; totalCount?: number } {
  const parsed = JSON.parse(body) as UserManagementAppListBody;
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];

  return {
    entries: entries
      .map((entry): UserManagementAppInfo | undefined => {
        if (typeof entry !== "object" || entry === null) {
          return undefined;
        }
        const app = entry as Record<string, unknown>;
        if (typeof app.id !== "string" || typeof app.name !== "string") {
          return undefined;
        }

        return { id: app.id, name: app.name };
      })
      .filter((entry): entry is UserManagementAppInfo => entry !== undefined),
    totalCount:
      typeof parsed.total_count === "number" ? parsed.total_count : undefined
  };
}
