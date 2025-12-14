import { describe, it, expect, beforeEach, vi } from "vitest";

const userFindUnique = vi.fn();
const userCreate = vi.fn();
const userCount = vi.fn();
const userFindMany = vi.fn();
const userUpdate = vi.fn();

const orderFindMany = vi.fn();
const reviewFindMany = vi.fn();

vi.mock("@core/prisma", () => ({
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
    $transaction: (operations: Array<Promise<unknown>>) =>
      Promise.all(operations)
  }
}));

const {
  createUser,
  findUserById,
  listUsers,
  getUserOrders
} = await import("@modules/users/users.service");

describe("users.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates users with lowercase emails", async () => {
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
    expect(userCreate).toHaveBeenCalled();
    expect(user.email).toBe("user@example.com");
  });

  it("throws when user not found", async () => {
    userFindUnique.mockResolvedValueOnce(null);
    await expect(findUserById("missing")).rejects.toHaveProperty(
      "code",
      "USER_NOT_FOUND"
    );
  });

  it("paginates user list", async () => {
    userFindMany.mockResolvedValueOnce([]);
    userCount.mockResolvedValueOnce(0);
    const result = await listUsers({});
    expect(result.page).toBe(1);
    expect(result.totalElements).toBe(0);
  });

  it("returns user orders with book info", async () => {
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
    expect(orders).toHaveLength(1);
    expect(orderFindMany).toHaveBeenCalled();
  });
});
