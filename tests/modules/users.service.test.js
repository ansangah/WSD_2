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
const userFindUnique = vitest_1.vi.fn();
const userCreate = vitest_1.vi.fn();
const userCount = vitest_1.vi.fn();
const userFindMany = vitest_1.vi.fn();
const userUpdate = vitest_1.vi.fn();
const orderFindMany = vitest_1.vi.fn();
const reviewFindMany = vitest_1.vi.fn();
vitest_1.vi.mock("@core/prisma", () => ({
    prisma: {
        user: {
            findUnique: userFindUnique,
            create: userCreate,
            count: userCount,
            findMany: userFindMany,
            update: userUpdate
        },
        order: {
            findMany: orderFindMany
        },
        review: {
            findMany: reviewFindMany
        },
        $transaction: (operations) => Promise.all(operations)
    }
}));
const { createUser, findUserById, listUsers, getUserOrders } = await Promise.resolve().then(() => __importStar(require("@modules/users/users.service")));
(0, vitest_1.describe)("users.service", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)("creates users with lowercase emails", async () => {
        userCreate.mockResolvedValue({
            id: "1",
            email: "user@example.com",
            name: "Foo Bar",
            phone: "010-0000-0000",
            role: "USER",
            status: "ACTIVE"
        });
        const user = await createUser({
            email: "USER@Example.com",
            password: "Password1!",
            name: "Foo Bar",
            phone: "010-0000-0000"
        });
        (0, vitest_1.expect)(userCreate).toHaveBeenCalled();
        (0, vitest_1.expect)(user.email).toBe("user@example.com");
    });
    (0, vitest_1.it)("throws when user not found", async () => {
        userFindUnique.mockResolvedValueOnce(null);
        await (0, vitest_1.expect)(findUserById("missing")).rejects.toHaveProperty("code", "USER_NOT_FOUND");
    });
    (0, vitest_1.it)("paginates user list", async () => {
        userFindMany.mockResolvedValueOnce([]);
        userCount.mockResolvedValueOnce(0);
        const result = await listUsers({});
        (0, vitest_1.expect)(result.page).toBe(1);
        (0, vitest_1.expect)(result.totalElements).toBe(0);
    });
    (0, vitest_1.it)("returns user orders with book info", async () => {
        userFindUnique.mockResolvedValueOnce({ id: "u1" });
        orderFindMany.mockResolvedValueOnce([
            {
                id: "order1",
                items: [
                    {
                        id: "item1",
                        book: { id: "b1", title: "Book", price: "10.00" }
                    }
                ]
            }
        ]);
        const orders = await getUserOrders("u1");
        (0, vitest_1.expect)(orders).toHaveLength(1);
        (0, vitest_1.expect)(orderFindMany).toHaveBeenCalled();
    });
});
//# sourceMappingURL=users.service.test.js.map