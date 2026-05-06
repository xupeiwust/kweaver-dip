import { Router, type NextFunction, type Request, type Response } from "express";

import { HttpError } from "../errors/http-error";
import { readAuthenticatedUserId } from "../middleware/hydra-auth";
import type {
  PutUserPreferencesRequest,
  UserPreferences
} from "../types/user-preference";
import {
  DefaultUserPreferenceLogic,
  type UserPreferenceLogic
} from "../logic/user-preference";
import {
  DefaultUserPreferenceMysqlStore
} from "../infra/user-preference-mysql-store";
import { getEnv } from "../utils/env";

const env = getEnv();
const userPreferenceLogic = new DefaultUserPreferenceLogic(
  new DefaultUserPreferenceMysqlStore({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })
);

/**
 * Builds the Studio user preference router.
 *
 * @param logic Optional user preference logic override.
 * @returns The router exposing Studio user preference endpoints.
 */
export function createUserPreferenceRouter(
  logic: UserPreferenceLogic = userPreferenceLogic
): Router {
  const router = Router();

  router.get(
    "/api/dip-studio/v1/user/preferences",
    async (
      request: Request,
      response: Response<UserPreferences>,
      next: NextFunction
    ): Promise<void> => {
      try {
        const userId = readRequiredAuthenticatedUserId(request);
        response.status(200).json(await logic.getUserPreferences(userId));
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to query user preferences")
        );
      }
    }
  );

  router.put(
    "/api/dip-studio/v1/user/preferences",
    async (
      request: Request,
      response: Response<UserPreferences>,
      next: NextFunction
    ): Promise<void> => {
      try {
        const userId = readRequiredAuthenticatedUserId(request);
        const body = readPutUserPreferencesRequest(request.body);
        response.status(200).json(await logic.putUserPreferences(userId, body));
      } catch (error) {
        next(
          error instanceof HttpError
            ? error
            : new HttpError(502, "Failed to update user preferences")
        );
      }
    }
  );

  return router;
}

/**
 * Reads the authenticated user id and rejects requests without one.
 *
 * @param request Incoming HTTP request.
 * @returns The normalized authenticated user id.
 */
export function readRequiredAuthenticatedUserId(request: Request): string {
  const userId = readAuthenticatedUserId(request);

  if (userId === undefined) {
    throw new HttpError(401, "Authenticated user id is required");
  }

  return userId;
}

/**
 * Validates the Studio user preference request body.
 *
 * @param body Unknown request payload.
 * @returns The validated request body.
 */
export function readPutUserPreferencesRequest(
  body: unknown
): PutUserPreferencesRequest {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }

  const rawIds = (body as { pinned_digital_human_ids?: unknown }).pinned_digital_human_ids;

  if (!Array.isArray(rawIds)) {
    throw new HttpError(400, "`pinned_digital_human_ids` must be an array");
  }

  return {
    pinned_digital_human_ids: rawIds
  };
}
