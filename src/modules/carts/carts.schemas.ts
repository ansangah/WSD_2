import { z } from "zod";
import { registry } from "@config/swagger";

export const cartItemSchema = registry.register(
  "CartItem",
  z.object({
    id: z.string(),
    bookId: z.string(),
    title: z.string(),
    quantity: z.number(),
    unitPrice: z.string(),
    subtotal: z.string()
  })
);

export const cartResponseSchema = registry.register(
  "CartResponse",
  z.object({
    cartId: z.string(),
    status: z.string(),
    totalItems: z.number(),
    totalQuantity: z.number(),
    subtotal: z.string(),
    items: z.array(cartItemSchema)
  })
);

export const modifyCartItemSchema = registry.register(
  "ModifyCartItemInput",
  z.object({
    bookId: z.string(),
    quantity: z.number().int().min(1).max(99)
  })
);

export const updateCartQuantitySchema = registry.register(
  "UpdateCartQuantityInput",
  z.object({
    quantity: z.number().int().min(1).max(99)
  })
);
