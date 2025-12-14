import { z } from "zod";
import { registry } from "@config/swagger";

export const addWishlistSchema = registry.register(
  "AddWishlistInput",
  z.object({
    bookId: z.string()
  })
);

export const wishlistCreatedSchema = registry.register(
  "WishlistCreated",
  z.object({
    wishlistId: z.string(),
    bookId: z.string(),
    createdAt: z.string()
  })
);

export const wishlistItemSchema = registry.register(
  "WishlistItem",
  z.object({
    wishlistId: z.string(),
    bookId: z.string(),
    bookTitle: z.string(),
    authors: z.array(
      z.object({
        id: z.string(),
        name: z.string()
      })
    ),
    categories: z.array(
      z.object({
        id: z.string(),
        name: z.string()
      })
    ),
    createdAt: z.string()
  })
);

export const wishlistListResponseSchema = registry.register(
  "WishlistListResponse",
  z.object({
    items: z.array(wishlistItemSchema)
  })
);
