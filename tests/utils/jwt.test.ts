import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from "@utils/jwt";

describe("jwt utilities", () => {
  it("signs and verifies access tokens", () => {
    const token = signAccessToken({
      sub: "user-1",
      email: "user@example.com",
      role: "USER"
    });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("user-1");
    expect(payload.type).toBe("access");
  });

  it("signs and verifies refresh tokens", () => {
    const token = signRefreshToken({
      sub: "user-2",
      email: "user2@example.com",
      role: "ADMIN"
    });
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe("user-2");
    expect(payload.type).toBe("refresh");
  });

  it("throws on invalid access token", () => {
    expect(() => verifyAccessToken("invalid.token")).toThrow();
  });
});
