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
const client_1 = require("@prisma/client");
const bookFindMany = vitest_1.vi.fn();
const userFindUnique = vitest_1.vi.fn();
const orderFindUnique = vitest_1.vi.fn();
const orderUpdate = vitest_1.vi.fn();
const transactionMock = vitest_1.vi.fn();
const activityLogCreate = vitest_1.vi.fn();
vitest_1.vi.mock("@core/prisma", () => ({
    prisma: {
        book: {
            findMany: bookFindMany,
            update: vitest_1.vi.fn()
        },
        user: {
            findUnique: userFindUnique
        },
        order: {
            create: vitest_1.vi.fn(),
            findUnique: orderFindUnique,
            update: orderUpdate,
            findMany: vitest_1.vi.fn()
        },
        orderItem: {
            groupBy: vitest_1.vi.fn()
        },
        activityLog: {
            create: activityLogCreate
        },
        $transaction: transactionMock
    }
}));
const { createOrder, cancelOrder } = await Promise.resolve().then(() => __importStar(require("@modules/orders/orders.service")));
(0, vitest_1.describe)("orders.service", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)("creates orders and updates stock", async () => {
        bookFindMany.mockResolvedValueOnce([
            {
                id: "b1",
                stock: 10,
                price: new client_1.Prisma.Decimal(20),
                title: "Test Book"
            }
        ]);
        userFindUnique.mockResolvedValueOnce({
            id: "user-1",
            email: "user@example.com",
            name: "Jane Reader"
        });
        const createdOrder = {
            id: "order1",
            totalAmount: new client_1.Prisma.Decimal(20),
            items: []
        };
        transactionMock.mockImplementation(async (callback) => callback({
            order: { create: vitest_1.vi.fn().mockResolvedValue(createdOrder) },
            book: { update: vitest_1.vi.fn().mockResolvedValue(undefined) }
        }));
        const order = await createOrder("user-1", {
            items: [{ bookId: "b1", quantity: 1 }],
            shippingFee: "0",
            discountTotal: "0"
        });
        (0, vitest_1.expect)(order.id).toBe("order1");
        (0, vitest_1.expect)(bookFindMany).toHaveBeenCalled();
        (0, vitest_1.expect)(transactionMock).toHaveBeenCalled();
    });
    (0, vitest_1.it)("prevents cancelling foreign orders", async () => {
        orderFindUnique.mockResolvedValueOnce({
            id: "order1",
            userId: "owner",
            status: "PENDING"
        });
        await (0, vitest_1.expect)(cancelOrder("order1", "other")).rejects.toHaveProperty("code", "FORBIDDEN");
    });
});
//# sourceMappingURL=orders.service.test.js.map