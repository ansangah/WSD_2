import { z } from "zod";
import { registry } from "@config/swagger";
export const bookResponseSchema = registry.register(
  "BookResponse",
  z.object({
    id: z.string(),
    isbn13: z.string().nullable(),
    title: z.string(),
    description: z.string(),
    price: z.string(),
    stock: z.number(),
    languageCode: z.string().nullable(),
    pageCount: z.number().nullable(),
    coverUrl: z.string().url().nullable(),
    publishedAt: z.string().datetime().nullable(),
    avgRating: z.string(),
    reviewCount: z.number(),
    categories: z
      .array(
        z.object({
          id: z.string(),
          name: z.string()
        })
      )
      .default([]),
    authors: z
      .array(
        z.object({
          id: z.string(),
          name: z.string()
        })
      )
      .default([]),
    createdAt: z.string(),
    updatedAt: z.string()
  })
);

export const createBookSchema = registry.register(
  "CreateBookInput",
  z.object({
    isbn13: z.string().length(13).optional(),
    title: z.string().min(3),
    description: z.string().min(10),
    price: z.string(),
    stock: z.number().int().nonnegative(),
    languageCode: z.string().optional(),
    pageCount: z.number().int().positive().optional(),
    coverUrl: z.string().url().optional(),
    publishedAt: z.string().datetime().optional(),
    categoryIds: z.array(z.string()).default([]),
    authorIds: z.array(z.string()).default([])
  })
);

export const updateBookSchema = registry.register(
  "UpdateBookInput",
  z.object({
    isbn13: z.string().length(13).optional(),
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    price: z.string().optional(),
    stock: z.number().int().nonnegative().optional(),
    languageCode: z.string().optional(),
    pageCount: z.number().int().positive().optional(),
    coverUrl: z.string().url().optional(),
    publishedAt: z.string().datetime().optional(),
    categoryIds: z.array(z.string()).optional(),
    authorIds: z.array(z.string()).optional()
  })
);

export const bookQuerySchema = registry.register(
  "BookQuery",
  z.object({
    page: z.string().optional(),
    size: z.string().optional(),
    sort: z
      .enum(["publishedAt", "avgRating", "price", "createdAt"])
      .optional(),
    order: z.enum(["asc", "desc"]).optional(),
    q: z.string().optional(),
    keyword: z.string().optional(),
    categoryId: z.string().optional(),
    authorId: z.string().optional(),
    languageCode: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    minRating: z.string().optional(),
    include: z.string().optional()
  })
);

export const paginatedBooksSchema = registry.register(
  "PaginatedBooks",
  z.object({
    content: z.array(bookResponseSchema),
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    sort: z.string().optional()
  })
);
