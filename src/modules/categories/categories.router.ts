import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { commonErrorResponses, registry, errorResponseSchema } from "@config/swagger";
import { authenticate, requireRoles } from "@middleware/auth";
import { validate } from "@middleware/validate";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryResponseSchema
} from "./categories.schemas";
import {
  createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} from "./categories.service";
import { prisma } from "@core/prisma";
import { successResponse } from "@utils/api-response";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/categories",
  tags: ["Categories"],
  summary: "카테고리 목록",
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Category list",
      content: {
        "application/json": {
          schema: z.array(categoryResponseSchema)
        }
      }
    }
  }
});

router.get("/", async (_req, res) => {
  const categories = await listCategories();
  return successResponse(res, { message: "ok", payload: categories });
});

registry.registerPath({
  method: "post",
  path: "/categories",
  tags: ["Categories"],
  summary: "카테고리 생성",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createCategorySchema
        }
      }
    }
  },
  responses: {
    ...commonErrorResponses(),
    201: {
      description: "Created",
      content: {
        "application/json": {
          schema: categoryResponseSchema
        }
      }
    }
  }
});

router.post(
  "/",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  validate({ body: createCategorySchema }),
  async (req, res) => {
    const category = await createCategory(req.body);
    return successResponse(res, {
      status: StatusCodes.CREATED,
      message: "카테고리가 생성되었습니다.",
      payload: category
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/categories/{id}",
  tags: ["Categories"],
  summary: "카테고리 상세",
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Category",
      content: {
        "application/json": {
          schema: categoryResponseSchema
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

router.get("/:id", async (req, res) => {
  const category = await getCategoryById(req.params.id);
  return successResponse(res, { message: "ok", payload: category });
});

registry.registerPath({
  method: "patch",
  path: "/categories/{id}",
  tags: ["Categories"],
  summary: "카테고리 수정",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateCategorySchema
        }
      }
    }
  },
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Updated",
      content: {
        "application/json": {
          schema: categoryResponseSchema
        }
      }
    }
  }
});

router.patch(
  "/:id",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  validate({ body: updateCategorySchema }),
  async (req, res) => {
    const category = await updateCategory(req.params.id, req.body);
    return successResponse(res, {
      message: "카테고리가 수정되었습니다.",
      payload: category
    });
  }
);

registry.registerPath({
  method: "delete",
  path: "/categories/{id}",
  tags: ["Categories"],
  summary: "카테고리 삭제",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    204: { description: "Deleted" }
  }
});

router.delete(
  "/:id",
  authenticate,
  requireRoles("ADMIN"),
  async (req, res) => {
    await deleteCategory(req.params.id);
    return successResponse(res, {
      message: "카테고리가 삭제되었습니다.",
      payload: { categoryId: req.params.id }
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/categories/{id}/books",
  tags: ["Categories"],
  summary: "카테고리별 도서 목록",
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Book list",
      content: {
        "application/json": {
          schema: z
            .array(
              z.object({
                id: z.string(),
                title: z.string(),
                price: z.string(),
                stock: z.number()
              })
            )
            .openapi({ title: "CategoryBooks" })
        }
      }
    }
  }
});

router.get("/:id/books", async (req, res) => {
  const books = await prisma.book.findMany({
    where: {
      deletedAt: null,
      categories: { some: { categoryId: req.params.id } }
    },
    select: {
      id: true,
      title: true,
      price: true,
      stock: true
    }
  });
  return successResponse(res, { message: "ok", payload: books });
});

export const categoriesRouter = router;
