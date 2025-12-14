import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { registry, errorResponseSchema } from "@config/swagger";
import { authenticate, requireRoles } from "@middleware/auth";
import { validate } from "@middleware/validate";
import {
  createUser,
  listUsers,
  findUserById,
  updateUser,
  deleteUser,
  changeUserRole,
  deactivateUser,
  getUserOrders,
  getUserReviews,
  updateProfile,
  getUserWithPassword,
  softDeleteUser,
  listUserLikes
} from "./users.service";
import {
  createUserSchema,
  userResponseSchema,
  paginatedUsersSchema,
  updateUserSchema,
  userQuerySchema,
  changeRoleSchema,
  deactivateSchema,
  profileUpdateSchema,
  userLikesQuerySchema,
  userLikesResponseSchema
} from "./users.schemas";
import { successResponse } from "@utils/api-response";
import { comparePassword } from "@utils/password";
import { listReviewsByUser } from "@modules/reviews/reviews.service";
import { userReviewQuerySchema } from "@modules/reviews/reviews.schemas";
import { ApiError, ERROR_CODES } from "@core/errors";

const router = Router();

const toIso = (value?: Date | null) =>
  value ? new Date(value).toISOString() : null;

const formatUserProfile = (user: any) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phone: user.phone ?? null,
  birthDate: toIso(user.birthDate ?? null),
  gender: user.gender ?? null,
  region: user.region ?? null,
  role: user.role,
  status: user.status,
  lastLoginAt: toIso(user.lastLoginAt ?? null),
  createdAt: toIso(user.createdAt),
  updatedAt: toIso(user.updatedAt)
});

const deleteMeSchema = z.object({
  password: z.string().min(8)
});
const userReviewResponseSchema = registry.register(
  "UserReviewList",
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        bookId: z.string(),
        bookTitle: z.string(),
        rating: z.number(),
        title: z.string().nullable(),
        body: z.string(),
        likeCount: z.number(),
        commentCount: z.number(),
        createdAt: z.string()
      })
    ),
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    sort: z.string().optional()
  })
);

registry.registerPath({
  method: "post",
  path: "/users",
  tags: ["Users"],
  summary: "Create a new user account",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createUserSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "User created",
      content: {
        "application/json": {
          schema: userResponseSchema
        }
      }
    },
    409: {
      description: "Duplicate user",
      content: {
        "application/json": {
          schema: errorResponseSchema
        }
      }
    }
  }
});

router.post("/", validate({ body: createUserSchema }), async (req, res) => {
  const user = await createUser(req.body);
  return successResponse(res, {
    status: StatusCodes.CREATED,
    message: "회원가입이 완료되었습니다.",
    payload: {
      userId: user.id,
      email: user.email,
      createdAt: toIso(user.createdAt)
    }
  });
});

registry.registerPath({
  method: "get",
  path: "/users",
  tags: ["Users"],
  summary: "List users (admin)",
  security: [{ bearerAuth: [] }],
  request: {
    query: userQuerySchema
  },
  responses: {
    200: {
      description: "Paginated user list",
      content: {
        "application/json": {
          schema: paginatedUsersSchema
        }
      }
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema
        }
      }
    }
  }
});

router.get(
  "/",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  validate({ query: userQuerySchema }),
  async (req, res) => {
    const result = await listUsers(req.query as Record<string, string>);
    return successResponse(res, {
      message: "ok",
      payload: {
        ...result,
        content: result.content.map(formatUserProfile)
      }
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/users/me",
  tags: ["Users"],
  summary: "Current user profile",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Profile data",
      content: {
        "application/json": {
          schema: userResponseSchema
        }
      }
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema
        }
      }
    }
  }
});

router.get("/me", authenticate, async (req, res) => {
  const user = await findUserById(req.user!.sub);
  return successResponse(res, {
    message: "ok",
    payload: formatUserProfile(user)
  });
});

registry.registerPath({
  method: "patch",
  path: "/users/me",
  tags: ["Users"],
  summary: "Update current user profile",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: profileUpdateSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: "Profile updated",
      content: {
        "application/json": {
          schema: userResponseSchema
        }
      }
    }
  }
});

router.patch(
  "/me",
  authenticate,
  validate({ body: profileUpdateSchema }),
  async (req, res) => {
    const updated = await updateProfile(req.user!.sub, req.body);
    return successResponse(res, {
      message: "프로필이 수정되었습니다.",
      payload: {
        userId: updated.id,
        updatedFields: Object.keys(req.body),
        profile: formatUserProfile(updated),
        updatedAt: toIso(updated.updatedAt)
      }
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/users/me/reviews",
  tags: ["Users", "Reviews"],
  summary: "Get my reviews",
  security: [{ bearerAuth: [] }],
  request: {
    query: userReviewQuerySchema
  },
  responses: {
    200: {
      description: "User reviews with pagination",
      content: {
        "application/json": {
          schema: userReviewResponseSchema
        }
      }
    }
  }
});

router.get(
  "/me/reviews",
  authenticate,
  validate({ query: userReviewQuerySchema }),
  async (req, res) => {
    const reviews = await listReviewsByUser(
      req.user!.sub,
      req.query as Record<string, string>
    );
    return successResponse(res, {
      message: "ok",
      payload: reviews
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/users/me/likes",
  tags: ["Users"],
  summary: "Get my likes",
  security: [{ bearerAuth: [] }],
  request: {
    query: userLikesQuerySchema
  },
  responses: {
    200: {
      description: "Liked reviews/comments",
      content: {
        "application/json": {
          schema: userLikesResponseSchema
        }
      }
    }
  }
});

router.get(
  "/me/likes",
  authenticate,
  validate({ query: userLikesQuerySchema }),
  async (req, res) => {
    const likes = await listUserLikes(
      req.user!.sub,
      req.query as Record<string, string>
    );
    return successResponse(res, { message: "ok", payload: likes });
  }
);

registry.registerPath({
  method: "delete",
  path: "/users/me",
  tags: ["Users"],
  summary: "Delete current user profile",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            password: z.string().min(8)
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: "Account deleted",
      content: {
        "application/json": {
          schema: errorResponseSchema
        }
      }
    }
  }
});

router.delete(
  "/me",
  authenticate,
  validate({ body: deleteMeSchema }),
  async (req, res) => {
    const user = await getUserWithPassword(req.user!.sub);
    if (!user) {
      throw new ApiError(ERROR_CODES.USER_NOT_FOUND, "User not found", {
        status: StatusCodes.NOT_FOUND
      });
    }
    const isValid = await comparePassword(req.body.password, user.passwordHash);
    if (!isValid) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, "Invalid credentials", {
        status: StatusCodes.UNAUTHORIZED
      });
    }
    const deleted = await softDeleteUser(req.user!.sub);
    return successResponse(res, {
      message: "탈퇴 처리가 완료되었습니다.",
      payload: {
        userId: deleted.id,
        deletedAt: toIso(deleted.deletedAt)
      }
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["Users"],
  summary: "Get user by id (admin)",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" }
    }
  ],
  responses: {
    200: {
      description: "User detail",
      content: {
        "application/json": {
          schema: userResponseSchema
        }
      }
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: errorResponseSchema
        }
      }
    }
  }
});

router.get(
  "/:id",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  async (req, res) => {
    const user = await findUserById(req.params.id);
    return successResponse(res, { message: "ok", payload: formatUserProfile(user) });
  }
);

registry.registerPath({
  method: "patch",
  path: "/users/{id}",
  tags: ["Users"],
  summary: "Update user (admin)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateUserSchema
        }
      }
    }
  },
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" }
    }
  ],
  responses: {
    200: {
      description: "User updated",
      content: {
        "application/json": {
          schema: userResponseSchema
        }
      }
    }
  }
});

router.patch(
  "/:id",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  validate({ body: updateUserSchema }),
  async (req, res) => {
    const user = await updateUser(req.params.id, req.body);
    return successResponse(res, {
      message: "사용자 정보가 수정되었습니다.",
      payload: formatUserProfile(user)
    });
  }
);

registry.registerPath({
  method: "delete",
  path: "/users/{id}",
  tags: ["Users"],
  summary: "Delete user (admin)",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    204: { description: "Deleted" }
  }
});

router.delete(
  "/:id",
  authenticate,
  requireRoles("ADMIN"),
  async (req, res) => {
    await deleteUser(req.params.id);
    return successResponse(res, {
      message: "사용자가 비활성화되었습니다.",
      payload: { userId: req.params.id }
    });
  }
);

registry.registerPath({
  method: "patch",
  path: "/users/{id}/role",
  tags: ["Users"],
  summary: "Change user role (admin)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: changeRoleSchema
        }
      }
    }
  },
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    200: {
      description: "Role updated",
      content: {
        "application/json": {
          schema: userResponseSchema
        }
      }
    }
  }
});

router.patch(
  "/:id/role",
  authenticate,
  requireRoles("ADMIN"),
  validate({ body: changeRoleSchema }),
  async (req, res) => {
    const user = await changeUserRole(req.params.id, req.body.role);
    return successResponse(res, {
      message: "사용자 역할이 변경되었습니다.",
      payload: formatUserProfile(user)
    });
  }
);

registry.registerPath({
  method: "patch",
  path: "/users/{id}/deactivate",
  tags: ["Users"],
  summary: "Deactivate user (admin)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: deactivateSchema
        }
      }
    }
  },
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    200: {
      description: "User status updated",
      content: {
        "application/json": {
          schema: userResponseSchema
        }
      }
    }
  }
});

router.patch(
  "/:id/deactivate",
  authenticate,
  requireRoles("ADMIN"),
  validate({ body: deactivateSchema }),
  async (req, res) => {
    const user = await deactivateUser(req.params.id, req.body.status);
    return successResponse(res, {
      message: "사용자 상태가 변경되었습니다.",
      payload: formatUserProfile(user)
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/users/{id}/orders",
  tags: ["Users"],
  summary: "Fetch user orders (admin)",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    200: {
      description: "Orders for user",
      content: {
        "application/json": {
          schema: z
            .array(
              z.object({
                id: z.string(),
                status: z.string(),
                totalAmount: z.string(),
                createdAt: z.string(),
                items: z.array(
                  z.object({
                    id: z.string(),
                    quantity: z.number(),
                    book: z.object({
                      id: z.string(),
                      title: z.string(),
                      price: z.string()
                    })
                  })
                )
              })
            )
            .openapi({ title: "UserOrders" })
        }
      }
    }
  }
});

router.get(
  "/:id/orders",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  async (req, res) => {
    const orders = await getUserOrders(req.params.id);
    return successResponse(res, { message: "ok", payload: orders });
  }
);

registry.registerPath({
  method: "get",
  path: "/users/{id}/reviews",
  tags: ["Users"],
  summary: "Fetch user reviews (admin)",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    200: {
      description: "Reviews for user",
      content: {
        "application/json": {
          schema: z
            .array(
              z.object({
                id: z.string(),
                rating: z.number(),
                body: z.string(),
                createdAt: z.string(),
                book: z.object({
                  id: z.string(),
                  title: z.string()
                })
              })
            )
            .openapi({ title: "UserReviews" })
        }
      }
    }
  }
});

router.get(
  "/:id/reviews",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  async (req, res) => {
    const reviews = await getUserReviews(req.params.id);
    return successResponse(res, { message: "ok", payload: reviews });
  }
);

export const usersRouter = router;
