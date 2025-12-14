import { Router } from "express";
import { commonErrorResponses, registry } from "@config/swagger";
import { validate } from "@middleware/validate";
import { successResponse } from "@utils/api-response";
import {
  authorResponseSchema,
  paginatedAuthorsSchema,
  authorDetailSchema,
  authorQuerySchema
} from "./authors.schemas";
import { listAuthors, getAuthorDetail } from "./authors.service";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/authors",
  tags: ["Authors"],
  summary: "페이지네이션 포함 작가 목록",
  request: {
    query: authorQuerySchema
  },
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Authors",
      content: {
        "application/json": {
          schema: paginatedAuthorsSchema
        }
      }
    }
  }
});

router.get(
  "/",
  validate({ query: authorQuerySchema }),
  async (req, res) => {
    const authors = await listAuthors(req.query as Record<string, string>);
    return successResponse(res, { message: "ok", payload: authors });
  }
);

registry.registerPath({
  method: "get",
  path: "/authors/{id}",
  tags: ["Authors"],
  summary: "작가 상세 조회",
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Author detail",
      content: {
        "application/json": {
          schema: authorDetailSchema
        }
      }
    }
  }
});

router.get("/:id", async (req, res) => {
  const author = await getAuthorDetail(req.params.id);
  return successResponse(res, { message: "ok", payload: author });
});

export const authorsRouter = router;
