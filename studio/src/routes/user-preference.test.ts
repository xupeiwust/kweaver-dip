import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import {
  createUserPreferenceRouter,
  readPutUserPreferencesRequest,
  readRequiredAuthenticatedUserId
} from "./user-preference";

/**
 * Creates a minimal response double with chainable methods.
 *
 * @returns The mocked response object.
 */
function createResponseDouble(): Response {
  const response = {
    status: vi.fn(),
    json: vi.fn()
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);

  return response;
}

/**
 * Reads one router layer by path and HTTP method.
 *
 * @param router Express router under test.
 * @param path Registered route path.
 * @param method Expected HTTP method.
 * @returns The matched route layer when found.
 */
function findRouteLayer(
  router: {
    stack: Array<{
      route?: {
        path: string;
        methods?: Record<string, boolean>;
        stack: Array<{
          handle: (
            request: Request,
            response: Response,
            next: NextFunction
          ) => Promise<void>;
        }>;
      };
    }>;
  },
  path: string,
  method: "get" | "put"
) {
  return router.stack.find(
    (entry) => entry.route?.path === path && entry.route?.methods?.[method] === true
  );
}

describe("readRequiredAuthenticatedUserId", () => {
  it("returns the normalized injected user id", () => {
    expect(
      readRequiredAuthenticatedUserId({
        headers: {
          "x-user-id": " user-1 "
        }
      } as Request)
    ).toBe("user-1");
  });

  it("rejects requests without an authenticated user id", () => {
    expect(() =>
      readRequiredAuthenticatedUserId({
        headers: {}
      } as Request)
    ).toThrow("Authenticated user id is required");
  });
});

describe("readPutUserPreferencesRequest", () => {
  it("accepts a request body with pinned digital human ids", () => {
    expect(
      readPutUserPreferencesRequest({
        pinned_digital_human_ids: ["dh-1"]
      })
    ).toEqual({
      pinned_digital_human_ids: ["dh-1"]
    });
  });

  it("rejects invalid request bodies", () => {
    expect(() => readPutUserPreferencesRequest(null)).toThrow(
      "Request body must be a JSON object"
    );
    expect(() => readPutUserPreferencesRequest([])).toThrow(
      "Request body must be a JSON object"
    );
    expect(() => readPutUserPreferencesRequest({})).toThrow(
      "`pinned_digital_human_ids` must be an array"
    );
  });
});

describe("createUserPreferenceRouter", () => {
  it("registers Studio user preference routes", () => {
    const router = createUserPreferenceRouter({
      getUserPreferences: vi.fn(),
      putUserPreferences: vi.fn()
    }) as {
      stack: Array<{
        route?: {
          path: string;
          methods?: Record<string, boolean>;
        };
      }>;
    };

    expect(
      findRouteLayer(router, "/api/dip-studio/v1/user/preferences", "get")
    ).toBeDefined();
    expect(
      findRouteLayer(router, "/api/dip-studio/v1/user/preferences", "put")
    ).toBeDefined();
  });

  it("handles one get request", async () => {
    const getUserPreferences = vi.fn().mockResolvedValue({
      pinned_digital_human_ids: ["dh-1", "dh-2"]
    });
    const router = createUserPreferenceRouter({
      getUserPreferences,
      putUserPreferences: vi.fn()
    }) as Parameters<typeof findRouteLayer>[0];
    const layer = findRouteLayer(router, "/api/dip-studio/v1/user/preferences", "get");
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await layer?.route?.stack[0]?.handle(
      {
        headers: {
          "x-user-id": "user-1"
        }
      } as Request,
      response,
      next
    );

    expect(getUserPreferences).toHaveBeenCalledWith("user-1");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      pinned_digital_human_ids: ["dh-1", "dh-2"]
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("handles one put request", async () => {
    const putUserPreferences = vi.fn().mockResolvedValue({
      pinned_digital_human_ids: ["dh-1", "dh-2"]
    });
    const router = createUserPreferenceRouter({
      getUserPreferences: vi.fn(),
      putUserPreferences
    }) as Parameters<typeof findRouteLayer>[0];
    const layer = findRouteLayer(router, "/api/dip-studio/v1/user/preferences", "put");
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();

    await layer?.route?.stack[0]?.handle(
      {
        headers: {
          "x-user-id": "user-1"
        },
        body: {
          pinned_digital_human_ids: ["dh-1", "dh-2"]
        }
      } as Request,
      response,
      next
    );

    expect(putUserPreferences).toHaveBeenCalledWith("user-1", {
      pinned_digital_human_ids: ["dh-1", "dh-2"]
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});
