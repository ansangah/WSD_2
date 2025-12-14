import { z } from "zod";
import { registry } from "@config/swagger";
import { userResponseSchema } from "@modules/users/users.schemas";

export const orderStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED"
]);

export const orderItemInputSchema = z.object({
  bookId: z.string(),
  quantity: z.number().int().min(1)
});

export const createOrderSchema = registry.register(
  "CreateOrderInput",
  z.object({
    items: z.array(orderItemInputSchema).min(1),
    shippingFee: z.string().default("0"),
    discountTotal: z.string().default("0"),
    customerName: z.string().optional(),
    customerEmail: z.string().email().optional()
  })
);

export const orderItemResponseSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  unitPrice: z.string(),
  subtotal: z.string(),
  book: z.object({
    id: z.string(),
    title: z.string()
  })
});

export const orderResponseSchema = registry.register(
  "OrderResponse",
  z.object({
    id: z.string(),
    status: orderStatusEnum,
    itemTotal: z.string(),
    discountTotal: z.string(),
    shippingFee: z.string(),
    totalAmount: z.string(),
    customerNameSnapshot: z.string(),
    customerEmailSnapshot: z.string(),
    createdAt: z.string(),
    cancelledAt: z.string().nullable(),
    user: userResponseSchema,
    items: z.array(orderItemResponseSchema)
  })
);

export const orderQuerySchema = registry.register(
  "OrderQuery",
  z.object({
    page: z.string().optional(),
    size: z.string().optional(),
    sort: z.string().optional(),
    status: orderStatusEnum.optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    keyword: z.string().optional()
  })
);

export const paginatedOrdersSchema = registry.register(
  "PaginatedOrders",
  z.object({
    content: z.array(orderResponseSchema),
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    sort: z.string().optional()
  })
);
