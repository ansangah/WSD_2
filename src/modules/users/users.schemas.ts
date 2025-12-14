import { z } from "zod";
import { registry } from "@config/swagger";

export const userRoleEnum = z.enum(["USER", "CURATOR", "ADMIN"]);
export const userStatusEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);

export const userResponseSchema = registry.register(
  "UserResponse",
  z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    phone: z.string().nullable(),
    birthDate: z.string().datetime().nullable(),
    gender: z.string().nullable(),
    region: z.string().nullable(),
    role: userRoleEnum,
    status: userStatusEnum,
    lastLoginAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
);

export const paginatedUsersSchema = registry.register(
  "PaginatedUsers",
  z.object({
    content: z.array(userResponseSchema),
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    sort: z.string().optional().nullable()
  })
);

export const createUserSchema = registry.register(
  "CreateUserInput",
  z.object({
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[^A-Za-z0-9]/, "Must contain special character"),
    name: z.string().min(1),
    phone: z.string().min(7).max(20).optional(),
    birthDate: z.string().datetime().optional(),
    gender: z.string().optional(),
    region: z.string().optional()
  })
);

export const updateUserSchema = registry.register(
  "UpdateUserInput",
  z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(7).max(20).optional(),
    birthDate: z.string().datetime().optional(),
    gender: z.string().optional(),
    region: z.string().optional(),
    status: userStatusEnum.optional()
  })
);

export const profileUpdateSchema = registry.register(
  "ProfileUpdateInput",
  z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(7).max(20).optional(),
    birthDate: z.string().datetime().optional(),
    gender: z.string().optional(),
    region: z.string().optional()
  })
);

export const changeRoleSchema = registry.register(
  "ChangeUserRoleInput",
  z.object({
    role: userRoleEnum
  })
);

export const deactivateSchema = registry.register(
  "DeactivateUserInput",
  z.object({
    status: userStatusEnum.default("INACTIVE")
  })
);

export const userQuerySchema = registry.register(
  "UserQuery",
  z.object({
    page: z.string().optional(),
    size: z.string().optional(),
    sort: z.string().optional(),
    keyword: z.string().optional(),
    role: userRoleEnum.optional(),
    status: userStatusEnum.optional()
  })
);

export const userLikesQuerySchema = registry.register(
  "UserLikesQuery",
  z.object({
    page: z.string().optional(),
    size: z.string().optional(),
    sort: z.string().optional().describe("Field to sort by, default createdAt"),
    order: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Sort order, default desc"),
    type: z.enum(["review", "comment"]).optional()
  })
);

export const userLikeItemSchema = registry.register(
  "UserLikeItem",
  z.object({
    type: z.enum(["review", "comment"]),
    reviewId: z.string().nullable(),
    commentId: z.string().nullable(),
    id: z.string(),
    bookId: z.string().nullable(),
    bookTitle: z.string().nullable(),
    rating: z.number().nullable(),
    reviewTitle: z.string().nullable(),
    likedAt: z.string()
  })
);

export const userLikesResponseSchema = registry.register(
  "UserLikesResponse",
  z.object({
    items: z.array(userLikeItemSchema),
    page: z.number(),
    size: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    type: z.enum(["review", "comment"])
  })
);

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
