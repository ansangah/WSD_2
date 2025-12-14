import { z } from "zod";
import { registry } from "@config/swagger";

export const reviewResponseSchema = registry.register(
  "ReviewResponse",
  z.object({
    id: z.string(),
    rating: z.number().min(1).max(5),
    title: z.string().nullable(),
    body: z.string(),
    likeCount: z.number(),
    commentCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    user: z.object({
      id: z.string(),
      name: z.string()
    }),
    book: z.object({
      id: z.string(),
      title: z.string()
    })
  })
);

export const createReviewSchema = registry.register(
  "CreateReviewInput",
  z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().min(1).max(120).optional(),
    body: z.string().min(10)
  })
);

export const updateReviewSchema = registry.register(
  "UpdateReviewInput",
  z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().min(1).max(120).optional(),
    body: z.string().min(10).optional()
  })
);

export const reviewQuerySchema = registry.register(
  "ReviewQuery",
  z.object({
    page: z.string().optional(),
    size: z.string().optional(),
    sort: z.string().optional(),
    bookId: z.string().optional(),
    userId: z.string().optional()
  })
);

export const userReviewQuerySchema = registry.register(
  "UserReviewQuery",
  z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    bookId: z.string().optional()
  })
);

export const bookReviewsQuerySchema = registry.register(
  "BookReviewsQuery",
  z.object({
    page: z.string().optional(),
    size: z.string().optional(),
    sort: z.enum(["createdAt", "likeCount", "rating"]).optional(),
    order: z.enum(["asc", "desc"]).optional()
  })
);

export const topReviewsQuerySchema = registry.register(
  "TopReviewsQuery",
  z.object({
    limit: z.string().optional(),
    bookId: z.string().optional(),
    sort: z.enum(["likeCount", "rating"]).optional(),
    order: z.enum(["asc", "desc"]).optional()
  })
);
