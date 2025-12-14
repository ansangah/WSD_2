import { Prisma } from "@core/prisma-client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@core/prisma";
import { ApiError, ERROR_CODES } from "@core/errors";
import {
  getPaginationParams,
  buildPaginationResponse
} from "@utils/pagination";
import type { z } from "zod";
import {
  createOrderSchema,
  orderQuerySchema,
  orderStatusEnum
} from "./orders.schemas";
import { recordActivity } from "@utils/activity-log";

type CreateOrderInput = z.infer<typeof createOrderSchema>;
type OrderQuery = z.infer<typeof orderQuerySchema>;
type OrderStatus = z.infer<typeof orderStatusEnum>;

const orderInclude = {
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      region: true,
      createdAt: true,
      updatedAt: true
    }
  },
  items: {
    include: {
      book: { select: { id: true, title: true } }
    }
  }
} as const;

export const createOrder = async (
  userId: string,
  input: CreateOrderInput
) => {
  const bookIds = input.items.map((item) => item.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } }
  });
  if (books.length !== bookIds.length) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Book missing", {
      status: StatusCodes.NOT_FOUND
    });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(ERROR_CODES.USER_NOT_FOUND, "User not found", {
      status: StatusCodes.NOT_FOUND
    });
  }

  const bookMap = new Map(books.map((book) => [book.id, book]));

  const itemsData = input.items.map((item) => {
    const book = bookMap.get(item.bookId)!;
    if (book.stock < item.quantity) {
      throw new ApiError(ERROR_CODES.STATE_CONFLICT, "Insufficient stock", {
        status: StatusCodes.CONFLICT,
        details: { bookId: book.id }
      });
    }
    const unitPrice = book.price;
    const subtotal = unitPrice.mul(item.quantity);
    return {
      bookId: book.id,
      titleSnapshot: book.title,
      quantity: item.quantity,
      unitPrice,
      subtotal
    };
  });

  const itemTotal = itemsData.reduce(
    (sum, item) => sum.add(item.subtotal),
    new Prisma.Decimal(0)
  );
  const discountTotal = new Prisma.Decimal(input.discountTotal ?? "0");
  const shippingFee = new Prisma.Decimal(input.shippingFee ?? "0");
  const totalAmount = itemTotal.minus(discountTotal).add(shippingFee);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        itemTotal,
        discountTotal,
        shippingFee,
        totalAmount,
        customerNameSnapshot: input.customerName ?? user.name,
        customerEmailSnapshot: input.customerEmail ?? user.email,
        items: {
          create: itemsData
        }
      },
      include: orderInclude
    });

    await Promise.all(
      itemsData.map((item) =>
        tx.book.update({
          where: { id: item.bookId },
          data: { stock: { decrement: item.quantity } }
        })
      )
    );

    return created;
  });

  await recordActivity(userId, "ORDER_CREATED", {
    orderId: order.id,
    total: order.totalAmount.toString()
  });

  return order;
};

export const listOrders = async (query: OrderQuery) => {
  const { page, size, skip, take, sort } = getPaginationParams(query);
  const where: Prisma.OrderWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.keyword
      ? {
          OR: [
            {
              customerNameSnapshot: {
                contains: query.keyword
              }
            },
            {
              customerEmailSnapshot: {
                contains: query.keyword
              }
            }
          ]
        }
      : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          createdAt: {
            gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
            lte: query.dateTo ? new Date(query.dateTo) : undefined
          }
        }
      : {})
  };

  const orderBy = sort
    ? (() => {
        const [field, direction] = sort.split(",");
        return { [field]: (direction ?? "asc").toLowerCase() === "desc" ? "desc" : "asc" };
      })()
    : { createdAt: "desc" as const };

  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take,
      include: orderInclude,
      orderBy
    }),
    prisma.order.count({ where })
  ]);

  return buildPaginationResponse(items, total, page, size, sort);
};

export const getOrderById = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude
  });
  if (!order) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Order not found", {
      status: StatusCodes.NOT_FOUND
    });
  }
  return order;
};

export const listMyOrders = (userId: string) =>
  prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: "desc" }
  });

export const updateOrderStatus = async (
  id: string,
  status: OrderStatus
) => {
  await getOrderById(id);
  return prisma.order.update({
    where: { id },
    data: { status },
    include: orderInclude
  });
};

export const cancelOrder = async (id: string, userId: string) => {
  const order = await getOrderById(id);
  if (order.userId !== userId) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Cannot cancel this order", {
      status: StatusCodes.FORBIDDEN
    });
  }
  if (order.status !== "PENDING") {
    throw new ApiError(ERROR_CODES.STATE_CONFLICT, "Order already processed", {
      status: StatusCodes.CONFLICT
    });
  }
  return prisma.order.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: orderInclude
  });
};
