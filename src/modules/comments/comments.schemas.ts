import { z } from "zod";
import { registry } from "@config/swagger";

export const commentResponseSchema = registry.register(
  "CommentResponse",
  z.object({
    id: z.string(),
    reviewId: z.string(),
    userId: z.string(),
    body: z.string(),
    likeCount: z.number(),
    parentCommentId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    user: z
      .object({
        id: z.string(),
        name: z.string().nullable()
      })
      .optional()
  })
);

export const paginatedCommentsSchema = registry.register(
  "PaginatedComments",
  z.object({
    content: z.array(commentResponseSchema),
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    sort: z.string().optional().nullable()
  })
);

export const createCommentSchema = registry.register(
  "CreateCommentInput",
  z.object({
    body: z.string().min(1).max(1000),
    parentCommentId: z.string().optional()
  })
);

export const updateCommentSchema = registry.register(
  "UpdateCommentInput",
  z.object({
    body: z.string().min(1).max(1000)
  })
);

export const commentQuerySchema = registry.register(
  "CommentQuery",
  z.object({
    page: z.string().optional(),
    size: z.string().optional(),
    sort: z.string().optional()
  })
);
