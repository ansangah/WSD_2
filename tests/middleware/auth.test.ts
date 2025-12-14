import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticate, requireRoles } from "@middleware/auth";
import { ApiError } from "@core/errors";

vi.mock("@utils/jwt", () => ({
  verifyAccessToken: vi.fn()
}));

const { verifyAccessToken } = await import("@utils/jwt");

const createReq = (headers: Record<string, string> = {}) =>
  ({
    headers,
    user: undefined
  }) as unknown as Parameters<typeof authenticate>[0];

const res = {} as Parameters<typeof authenticate>[1];
const next = vi.fn();

describe("auth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when token missing", () => {
    expect(() => authenticate(createReq(), res, next)).toThrow(ApiError);
  });

  it("populates user when token valid", () => {
    (verifyAccessToken as ReturnType<typeof vi.fn>).mockReturnValue({
      sub: "user-1",
      role: "ADMIN",
      email: "user@example.com",
      type: "access"
    });

    const req = createReq({ authorization: "Bearer token" });
    authenticate(req, res, next);
    expect(req.user?.sub).toBe("user-1");
    expect(next).toHaveBeenCalled();
  });

  it("blocks when role missing", () => {
    const req = createReq({ authorization: "Bearer token" });
    req.user = {
      sub: "user-2",
      role: "USER",
      email: "user2@example.com",
      type: "access"
    };
    expect(() =>
      requireRoles("ADMIN")(req, res, next)
    ).toThrow(ApiError);
  });
});
