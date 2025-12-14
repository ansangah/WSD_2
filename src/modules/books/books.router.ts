import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { registry, errorResponseSchema } from "@config/swagger";
import { authenticate, requireRoles } from "@middleware/auth";
import { validate } from "@middleware/validate";
import {
  createBook,
  listBooks,
  getBookById,
  updateBook,
  archiveBook,
  getRelatedBooks
} from "./books.service";
import {
  createBookSchema,
  updateBookSchema,
  bookResponseSchema,
  bookQuerySchema,
  paginatedBooksSchema
} from "./books.schemas";
import {
  createReviewSchema,
  bookReviewsQuerySchema
} from "@modules/reviews/reviews.schemas";
import {
  listBookReviews,
  createReviewForBook
} from "@modules/reviews/reviews.service";
import { successResponse } from "@utils/api-response";

const router = Router();
const adminRouter = Router();

registry.registerPath({
  method: "get",
  path: "/books",
  tags: ["Books"],
  summary: "List books with pagination, filters, and sorting",
  request: {
    query: bookQuerySchema
  },
  responses: {
    200: {
      description: "Book list",
      content: {
        "application/json": {
          schema: paginatedBooksSchema
        }
      }
    }
  }
});

router.get(
  "/",
  validate({ query: bookQuerySchema }),
  async (req, res) => {
    const result = await listBooks(req.query as Record<string, string>);
    return successResponse(res, { message: "ok", payload: result });
  }
);

registry.registerPath({
  method: "post",
  path: "/admin/books",
  tags: ["Books"],
  summary: "Create book",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createBookSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Book created",
      content: {
        "application/json": {
          schema: bookResponseSchema
        }
      }
    }
  }
});

adminRouter.post(
  "/",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  validate({ body: createBookSchema }),
  async (req, res) => {
    const book = await createBook(req.body);
    return successResponse(res, {
      status: StatusCodes.CREATED,
      message: "도서가 등록되었습니다.",
      payload: book
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/books/{id}",
  tags: ["Books"],
  summary: "Get book detail",
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    200: {
      description: "Book detail",
      content: {
        "application/json": {
          schema: bookResponseSchema
        }
      }
    }
  }
});

router.get("/:id", async (req, res) => {
  const book = await getBookById(req.params.id);
  return successResponse(res, { message: "ok", payload: book });
});

registry.registerPath({
  method: "patch",
  path: "/admin/books/{id}",
  tags: ["Books"],
  summary: "Update book",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateBookSchema
        }
      }
    }
  },
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    200: {
      description: "Book updated",
      content: {
        "application/json": {
          schema: bookResponseSchema
        }
      }
    }
  }
});

adminRouter.patch(
  "/:id",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  validate({ body: updateBookSchema }),
  async (req, res) => {
    const book = await updateBook(req.params.id, req.body);
    return successResponse(res, {
      message: "도서 정보가 수정되었습니다.",
      payload: book
    });
  }
);

registry.registerPath({
  method: "delete",
  path: "/admin/books/{id}",
  tags: ["Books"],
  summary: "Archive book",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    204: { description: "Archived" }
  }
});

adminRouter.delete(
  "/:id",
  authenticate,
  requireRoles("ADMIN"),
  async (req, res) => {
    await archiveBook(req.params.id);
    res.status(StatusCodes.NO_CONTENT).send();
  }
);

registry.registerPath({
  method: "get",
  path: "/books/{id}/reviews",
  tags: ["Books", "Reviews"],
  summary: "List reviews for book",
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  request: {
    query: bookReviewsQuerySchema
  },
  responses: {
    200: {
      description: "Reviews",
      content: {
        "application/json": {
          schema: z.object({
            content: z.array(
              z.object({
                id: z.string(),
                rating: z.number(),
                title: z.string().nullable(),
                body: z.string(),
                createdAt: z.string(),
                likeCount: z.number(),
                user: z.object({
                  id: z.string(),
                  name: z.string()
                })
              })
            ),
            page: z.number(),
            size: z.number(),
            totalElements: z.number(),
            totalPages: z.number()
          })
        }
      }
    }
  }
});

router.get(
  "/:id/reviews",
  validate({ query: bookReviewsQuerySchema }),
  async (req, res) => {
    const reviews = await listBookReviews(
      req.params.id,
      req.query as Record<string, string>
    );
    return successResponse(res, { message: "ok", payload: reviews });
  }
);

registry.registerPath({
  method: "post",
  path: "/books/{id}/reviews",
  tags: ["Books", "Reviews"],
  summary: "Create review for book",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createReviewSchema
        }
      }
    }
  },
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    201: {
      description: "Review submitted",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            rating: z.number(),
            status: z.string()
          })
        }
      }
    }
  }
});

router.post(
  "/:id/reviews",
  authenticate,
  validate({
    body: createReviewSchema
  }),
  async (req, res) => {
    const review = await createReviewForBook(
      req.params.id,
      req.user!.sub,
      req.body
    );
    return successResponse(res, {
      status: StatusCodes.CREATED,
      message: "리뷰가 등록되었습니다.",
      payload: review
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/books/{id}/related",
  tags: ["Books"],
  summary: "Related books",
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    200: {
      description: "Related items",
      content: {
        "application/json": {
          schema: z
            .array(
              z.object({
                id: z.string(),
                name: z.string(),
                price: z.string()
              })
            )
            .openapi({ title: "RelatedBooks" })
        }
      }
    }
  }
});

router.get("/:id/related", async (req, res) => {
  const related = await getRelatedBooks(req.params.id);
  return successResponse(res, { message: "ok", payload: related });
});

export const booksRouter = router;
export const adminBooksRouter = adminRouter;
