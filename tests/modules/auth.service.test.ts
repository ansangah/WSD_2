import { describe, it, expect, beforeEach, vi } from "vitest";
import { hashPassword } from "@utils/password";
import { signRefreshToken } from "@utils/jwt";

const refreshTokenCreate = vi.fn();
const refreshTokenFindFirst = vi.fn();
const refreshTokenUpdate = vi.fn();
const refreshTokenUpdateMany = vi.fn();
const userUpdate = vi.fn();
const activityLogCreate = vi.fn();

vi.mock("@core/prisma", () => ({
  prisma: {
    refreshToken: {
      create: refreshTokenCreate,
      findFirst: refreshTokenFindFirst,
      update: refreshTokenUpdate,
      updateMany: refreshTokenUpdateMany
    },
    user: {
      update: userUpdate
    },
    activityLog: {
      create: activityLogCreate
    },
    $transaction: (operations: Array<Promise<unknown>>) =>
      Promise.all(operations)
  }
}));

const mockFindUserByEmail = vi.fn();

vi.mock("@modules/users/users.service", () => ({
  findUserByEmail: mockFindUserByEmail
}));

const { login, rotateToken } = await import("@modules/auth/auth.service");

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in valid users", async () => {
    const passwordHash = await hashPassword("Password1!");
    mockFindUserByEmail.mockResolvedValue({
      id: "user1",
      email: "user@example.com",
      passwordHash,
      role: "USER",
      status: "ACTIVE"
    });
    refreshTokenCreate.mockResolvedValue({});

    const result = await login("user@example.com", "Password1!");
    expect(result.accessToken).toBeDefined();
    expect(refreshTokenCreate).toHaveBeenCalled();
  });

  it("rotates refresh tokens", async () => {
    refreshTokenFindFirst.mockResolvedValue({
      id: "tok1",
      token: "dummy",
      expiresAt: new Date(Date.now() + 1000),
      user: {
        id: "user1",
        email: "user@example.com",
        role: "USER",
        passwordHash: "hash",
        status: "ACTIVE"
      }
    });
    refreshTokenUpdate.mockResolvedValue({});
    refreshTokenCreate.mockResolvedValue({});

    await rotateToken(
      signRefreshToken({ sub: "user1", email: "user@example.com", role: "USER" })
    );
    expect(refreshTokenCreate).toHaveBeenCalled();
  });
});
