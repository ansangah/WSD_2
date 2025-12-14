import { z } from "zod";
import { registry } from "@config/swagger";

export const authorResponseSchema = registry.register(
  "AuthorResponse",
  z.object({
    id: z.string(),
    name: z.string(),
    biography: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
  })
);

export const paginatedAuthorsSchema = registry.register(
  "PaginatedAuthors",
  z.object({
    content: z.array(authorResponseSchema),
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    sort: z.string().optional().nullable()
  })
);

export const authorQuerySchema = registry.register(
  "AuthorQuery",
  z.object({
    page: z.string().optional(),
    size: z.string().optional(),
    sort: z.string().optional(),
    keyword: z.string().optional()
  })
);

export const authorDetailSchema = registry.register(
  "AuthorDetail",
  z.object({
    id: z.string(),
    name: z.string(),
    biography: z.string().nullable(),
    books: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        publishedAt: z.string().nullable()
      })
    )
  })
);
