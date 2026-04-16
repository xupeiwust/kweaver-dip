import type { NextFunction, Request, Response, Router } from "express";
import { describe, expect, it, vi } from "vitest";

import { readChannelUserListQuery } from "./channel-user-query";
import {
  createChannelUserRouter,
  readUpsertChannelUserRequest
} from "./channel-user";

/**
 * Creates a minimal response double with Express-like chaining.
 *
 * @returns Mocked response.
 */
function createResponseDouble(): Response {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
    end: vi.fn(),
    send: vi.fn(),
    setHeader: vi.fn()
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);
  return response;
}

/**
 * Finds a route handler by method and path.
 *
 * @param router Express router.
 * @param method HTTP method.
 * @param path Route path.
 * @param index Handler index within the route stack.
 * @returns Route handler when found.
 */
function findHandler(
  router: Router,
  method: "get" | "post" | "put" | "delete",
  path: string,
  index = 0
): ((request: Request, response: Response, next: NextFunction) => void | Promise<void>) | undefined {
  const layer = (router as Router & {
    stack: Array<{
      route?: {
        path: string;
        methods: Record<string, boolean>;
        stack: Array<{
          handle: (request: Request, response: Response, next: NextFunction) => void | Promise<void>;
        }>;
      };
    }>;
  }).stack.find((entry) => entry.route?.path === path && entry.route.methods[method]);

  return layer?.route?.stack[index]?.handle;
}

describe("readChannelUserListQuery", () => {
  it("parses supported query parameters", () => {
    expect(
      readChannelUserListQuery({
        type: "feishu",
        displayName: "Alice",
        digitalHumanId: "agent-1",
        start: "10",
        limit: "20"
      })
    ).toEqual({
      type: "feishu",
      displayName: "Alice",
      digitalHumanId: "agent-1",
      start: 10,
      limit: 20
    });
  });

  it("rejects invalid numeric and type query parameters", () => {
    expect(() => readChannelUserListQuery({ start: "1.5" })).toThrow("start must be an integer");
    expect(() => readChannelUserListQuery({ type: "slack" })).toThrow('type must be "feishu" or "dingding"');
    expect(() => readChannelUserListQuery({ limit: {} as unknown as string })).toThrow("limit must be an integer");
  });

  it("omits empty optional query parameters", () => {
    expect(
      readChannelUserListQuery({
        displayName: " ",
        digitalHumanId: ""
      })
    ).toEqual({});
  });
});

describe("readUpsertChannelUserRequest", () => {
  it("parses a valid create/update payload", () => {
    expect(
      readUpsertChannelUserRequest({
        displayName: "Alice",
        channel: {
          type: "dingding",
          openid: "o-1"
        }
      })
    ).toEqual({
      displayName: "Alice",
      channel: {
        type: "dingding",
        openid: "o-1"
      }
    });
  });

  it("rejects invalid request bodies", () => {
    expect(() => readUpsertChannelUserRequest(null)).toThrow("Request body must be a JSON object");
    expect(() => readUpsertChannelUserRequest({ displayName: "Alice" })).toThrow("channel is required");
    expect(() => readUpsertChannelUserRequest({
      displayName: "Alice",
      channel: { type: "slack", openid: "o-1" }
    })).toThrow('type must be "feishu" or "dingding"');
    expect(() => readUpsertChannelUserRequest({
      displayName: "",
      channel: { type: "feishu", openid: "o-1" }
    })).toThrow("displayName is required");
    expect(() => readUpsertChannelUserRequest({
      displayName: "Alice",
      channel: { openid: "o-1" }
    })).toThrow('channel.type must be "feishu" or "dingding"');
  });
});

describe("createChannelUserRouter", () => {
  it("returns the channel user list", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const router = createChannelUserRouter({
      listChannelUsers: vi.fn().mockResolvedValue({
        items: [{ displayName: "Alice", channel: { type: "feishu", openid: "o-1" } }],
        total: 1,
        start: 0,
        limit: 50
      }),
      createChannelUser: vi.fn(),
      updateChannelUser: vi.fn(),
      deleteChannelUser: vi.fn(),
      importChannelUsers: vi.fn(),
      exportChannelUsers: vi.fn(),
      updateDigitalHumanChannelUsers: vi.fn()
    });

    await findHandler(router as Router, "get", "/api/dip-studio/v1/channel-users")?.(
      { query: {} } as unknown as Request,
      response,
      next
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      items: [{ displayName: "Alice", channel: { type: "feishu", openid: "o-1" } }],
      total: 1,
      start: 0,
      limit: 50
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("wraps unexpected list failures as 502", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const router = createChannelUserRouter({
      listChannelUsers: vi.fn().mockRejectedValue(new Error("boom")),
      createChannelUser: vi.fn(),
      updateChannelUser: vi.fn(),
      deleteChannelUser: vi.fn(),
      importChannelUsers: vi.fn(),
      exportChannelUsers: vi.fn(),
      updateDigitalHumanChannelUsers: vi.fn()
    });

    await findHandler(router as Router, "get", "/api/dip-studio/v1/channel-users")?.(
      { query: {} } as unknown as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 502,
        message: "Failed to query channel users"
      })
    );
  });

  it("creates one channel user", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const createChannelUser = vi.fn().mockResolvedValue({
      id: "feishu:o-1",
      displayName: "Alice",
      channel: {
        type: "feishu",
        openid: "o-1"
      }
    });
    const router = createChannelUserRouter({
      listChannelUsers: vi.fn(),
      createChannelUser,
      updateChannelUser: vi.fn(),
      deleteChannelUser: vi.fn(),
      importChannelUsers: vi.fn(),
      exportChannelUsers: vi.fn(),
      updateDigitalHumanChannelUsers: vi.fn()
    });

    await findHandler(router as Router, "post", "/api/dip-studio/v1/channel-users")?.(
      {
        body: {
          displayName: "Alice",
          channel: {
            type: "feishu",
            openid: "o-1"
          }
        }
      } as unknown as Request,
      response,
      next
    );

    expect(createChannelUser).toHaveBeenCalledWith({
      displayName: "Alice",
      channel: {
        type: "feishu",
        openid: "o-1"
      }
    });
    expect(response.status).toHaveBeenCalledWith(201);
  });

  it("updates and deletes a channel user", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const updateChannelUser = vi.fn().mockResolvedValue({
      id: "feishu:o-2",
      displayName: "Alice",
      channel: { type: "feishu", openid: "o-2" }
    });
    const deleteChannelUser = vi.fn().mockResolvedValue(undefined);
    const router = createChannelUserRouter({
      listChannelUsers: vi.fn(),
      createChannelUser: vi.fn(),
      updateChannelUser,
      deleteChannelUser,
      importChannelUsers: vi.fn(),
      exportChannelUsers: vi.fn(),
      updateDigitalHumanChannelUsers: vi.fn()
    });

    await findHandler(router as Router, "put", "/api/dip-studio/v1/channel-users/:id")?.(
      {
        params: { id: "feishu:o-1" },
        body: {
          displayName: "Alice",
          channel: { type: "feishu", openid: "o-2" }
        }
      } as unknown as Request,
      response,
      next
    );
    await findHandler(router as Router, "delete", "/api/dip-studio/v1/channel-users/:id")?.(
      { params: { id: "feishu:o-1" } } as unknown as Request,
      response,
      next
    );

    expect(updateChannelUser).toHaveBeenCalledWith("feishu:o-1", {
      displayName: "Alice",
      channel: { type: "feishu", openid: "o-2" }
    });
    expect(deleteChannelUser).toHaveBeenCalledWith("feishu:o-1");
    expect(response.end).toHaveBeenCalled();
  });

  it("rejects missing route ids for update and delete", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const router = createChannelUserRouter({
      listChannelUsers: vi.fn(),
      createChannelUser: vi.fn(),
      updateChannelUser: vi.fn(),
      deleteChannelUser: vi.fn(),
      importChannelUsers: vi.fn(),
      exportChannelUsers: vi.fn(),
      updateDigitalHumanChannelUsers: vi.fn()
    });

    await findHandler(router as Router, "put", "/api/dip-studio/v1/channel-users/:id")?.(
      { params: { id: "" }, body: {} } as unknown as Request,
      response,
      next
    );
    await findHandler(router as Router, "delete", "/api/dip-studio/v1/channel-users/:id")?.(
      { params: { id: "" } } as unknown as Request,
      response,
      next
    );

    expect(next).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ statusCode: 400, message: "id path parameter is required" })
    );
    expect(next).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ statusCode: 400, message: "id path parameter is required" })
    );
  });

  it("exports JSONL as attachment", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const router = createChannelUserRouter({
      listChannelUsers: vi.fn(),
      createChannelUser: vi.fn(),
      updateChannelUser: vi.fn(),
      deleteChannelUser: vi.fn(),
      importChannelUsers: vi.fn(),
      exportChannelUsers: vi.fn().mockResolvedValue({
        filename: "通道用户_2026_04_16_15_16_08.jsonl",
        content: "{\"displayName\":\"Alice\",\"channel\":{\"type\":\"feishu\",\"openid\":\"o-1\"}}\n"
      }),
      updateDigitalHumanChannelUsers: vi.fn()
    });

    await findHandler(router as Router, "get", "/api/dip-studio/v1/channel-users/export")?.(
      {} as Request,
      response,
      next
    );

    expect(response.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/x-ndjson; charset=utf-8"
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith("{\"displayName\":\"Alice\",\"channel\":{\"type\":\"feishu\",\"openid\":\"o-1\"}}\n");
  });

  it("fails import when multipart file is missing", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const router = createChannelUserRouter({
      listChannelUsers: vi.fn(),
      createChannelUser: vi.fn(),
      updateChannelUser: vi.fn(),
      deleteChannelUser: vi.fn(),
      importChannelUsers: vi.fn(),
      exportChannelUsers: vi.fn(),
      updateDigitalHumanChannelUsers: vi.fn()
    });

    await findHandler(router as Router, "post", "/api/dip-studio/v1/channel-users/import", 1)?.(
      { file: undefined } as unknown as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Multipart field `file` is required"
      })
    );
  });

  it("imports JSONL content", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const importChannelUsers = vi.fn().mockResolvedValue({ count: 1 });
    const router = createChannelUserRouter({
      listChannelUsers: vi.fn(),
      createChannelUser: vi.fn(),
      updateChannelUser: vi.fn(),
      deleteChannelUser: vi.fn(),
      importChannelUsers,
      exportChannelUsers: vi.fn(),
      updateDigitalHumanChannelUsers: vi.fn()
    });

    await findHandler(router as Router, "post", "/api/dip-studio/v1/channel-users/import", 1)?.(
      {
        file: {
          buffer: Buffer.from("{\"displayName\":\"Alice\",\"channel\":{\"type\":\"feishu\",\"openid\":\"o-1\"}}\n")
        }
      } as unknown as Request,
      response,
      next
    );

    expect(importChannelUsers).toHaveBeenCalledWith("{\"displayName\":\"Alice\",\"channel\":{\"type\":\"feishu\",\"openid\":\"o-1\"}}\n");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ count: 1 });
  });

  it("wraps unexpected import failures as 502", async () => {
    const response = createResponseDouble();
    const next = vi.fn<NextFunction>();
    const router = createChannelUserRouter({
      listChannelUsers: vi.fn(),
      createChannelUser: vi.fn(),
      updateChannelUser: vi.fn(),
      deleteChannelUser: vi.fn(),
      importChannelUsers: vi.fn().mockRejectedValue(new Error("boom")),
      exportChannelUsers: vi.fn(),
      updateDigitalHumanChannelUsers: vi.fn()
    });

    await findHandler(router as Router, "post", "/api/dip-studio/v1/channel-users/import", 1)?.(
      {
        file: {
          buffer: Buffer.from("{\"displayName\":\"Alice\",\"channel\":{\"type\":\"feishu\",\"openid\":\"o-1\"}}\n")
        }
      } as unknown as Request,
      response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 502,
        message: "Failed to import channel users"
      })
    );
  });
});
