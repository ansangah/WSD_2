"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const password_1 = require("@utils/password");
const jwt_1 = require("@utils/jwt");
const refreshTokenCreate = vitest_1.vi.fn();
const refreshTokenFindFirst = vitest_1.vi.fn();
const refreshTokenUpdate = vitest_1.vi.fn();
const refreshTokenUpdateMany = vitest_1.vi.fn();
const userUpdate = vitest_1.vi.fn();
const activityLogCreate = vitest_1.vi.fn();
vitest_1.vi.mock("@core/prisma", () => ({
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
        $transaction: (operations) => Promise.all(operations)
    }
}));
const mockFindUserByEmail = vitest_1.vi.fn();
vitest_1.vi.mock("@modules/users/users.service", () => ({
    findUserByEmail: mockFindUserByEmail
}));
const { login, rotateToken } = await Promise.resolve().then(() => __importStar(require("@modules/auth/auth.service")));
(0, vitest_1.describe)("auth.service", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)("logs in valid users", async () => {
        const passwordHash = await (0, password_1.hashPassword)("Password1!");
        mockFindUserByEmail.mockResolvedValue({
            id: "user1",
            email: "user@example.com",
            passwordHash,
            role: "USER",
            status: "ACTIVE"
        });
        refreshTokenCreate.mockResolvedValue({});
        const result = await login("user@example.com", "Password1!");
        (0, vitest_1.expect)(result.accessToken).toBeDefined();
        (0, vitest_1.expect)(refreshTokenCreate).toHaveBeenCalled();
    });
    (0, vitest_1.it)("rotates refresh tokens", async () => {
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
        await rotateToken((0, jwt_1.signRefreshToken)({ sub: "user1", email: "user@example.com", role: "USER" }));
        (0, vitest_1.expect)(refreshTokenCreate).toHaveBeenCalled();
    });
});
//# sourceMappingURL=auth.service.test.js.map