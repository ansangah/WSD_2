import { describe, it, expect, beforeEach, vi } from "vitest";
import { Prisma } from "@prisma/client";

const bookFindMany = vi.fn();
const userFindUnique = vi.fn();
const orderFindUnique = vi.fn();
const orderUpdate = vi.fn();

const transactionMock = vi.fn();

const activityLogCreate = vi.fn();

vi.mock("@core/prisma", () => ({
  prisma: {
    book: {
      findMany: bookFindMany,
      update: vi.fn()
    },
    user: {
      findUnique: userFindUnique
    },
    order: {
      create: vi.fn(),
      findUnique: orderFindUnique,
      update: orderUpdate,
      findMany: vi.fn()
    },
    orderItem: {
      groupBy: vi.fn()
    },
    activityLog: {
      create: activityLogCreate
    },
    $transaction: transactionMock
  }
}));

const { createOrder, cancelOrder } = await import(
  "@modules/orders/orders.service"
);

describe("orders.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates orders and updates stock", async () => {
    bookFindMany.mockResolvedValueOnce([
      {
        id: "b1",
        stock: 10,
        price: new Prisma.Decimal(20),
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
      totalAmount: new Prisma.Decimal(20),
      items: []
    };
    transactionMock.mockImplementation(async (callback) =>
      callback({
        order: { create: vi.fn().mockResolvedValue(createdOrder) },
        book: { update: vi.fn().mockResolvedValue(undefined) }
      })
    );

    const order = await createOrder("user-1", {
      items: [{ bookId: "b1", quantity: 1 }],
      shippingFee: "0",
      discountTotal: "0"
    });
    expect(order.id).toBe("order1");
    expect(bookFindMany).toHaveBeenCalled();
    expect(transactionMock).toHaveBeenCalled();
  });

  it("prevents cancelling foreign orders", async () => {
    orderFindUnique.mockResolvedValueOnce({
      id: "order1",
      userId: "owner",
      status: "PENDING"
    });
    await expect(cancelOrder("order1", "other")).rejects.toHaveProperty(
      "code",
      "FORBIDDEN"
    );
  });
});
