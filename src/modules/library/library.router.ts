import { Router } from "express";
import { commonErrorResponses, registry } from "@config/swagger";
import { authenticate } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { successResponse } from "@utils/api-response";
import {
  addLibrarySchema,
  libraryItemSchema,
  libraryListResponseSchema
} from "./library.schemas";
import {
  addLibraryEntry,
  listLibraryEntries,
  removeLibraryEntry
} from "./library.service";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/library",
  tags: ["Library"],
  summary: "List owned books",
  security: [{ bearerAuth: [] }],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Library entries",
      content: {
        "application/json": {
          schema: libraryListResponseSchema
        }
      }
    }
  }
});

router.get("/", authenticate, async (req, res) => {
  const items = await listLibraryEntries(req.user!.sub);
  return successResponse(res, { message: "ok", payload: { items } });
});

registry.registerPath({
  method: "post",
  path: "/library",
  tags: ["Library"],
  summary: "Add a book to library",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: addLibrarySchema
        }
      }
    }
  },
  responses: {
    ...commonErrorResponses(),
    201: {
      description: "Added",
      content: {
        "application/json": {
          schema: libraryItemSchema
        }
      }
    }
  }
});

router.post(
  "/",
  authenticate,
  validate({ body: addLibrarySchema }),
  async (req, res) => {
    const item = await addLibraryEntry(
      req.user!.sub,
      req.body.bookId,
      req.body.source
    );
    return successResponse(res, {
      status: 201,
      message: "내 서재에 추가되었습니다.",
      payload: item
    });
  }
);

registry.registerPath({
  method: "delete",
  path: "/library/{id}",
  tags: ["Library"],
  summary: "Remove library entry",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Removed",
      content: {
        "application/json": {
          schema: libraryItemSchema
        }
      }
    }
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  await removeLibraryEntry(req.user!.sub, req.params.id);
  return successResponse(res, {
    message: "내 서재에서 삭제되었습니다.",
    payload: { entryId: req.params.id }
  });
});

export const libraryRouter = router;
