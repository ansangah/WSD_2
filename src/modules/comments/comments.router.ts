import { Router } from "express";
import { z } from "zod";
import { registry, errorResponseSchema } from "@config/swagger";
import { authenticate } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { successResponse } from "@utils/api-response";
import {
  commentResponseSchema,
  paginatedCommentsSchema,
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema
} from "./comments.schemas";
import {
  listComments,
  createComment,
  deleteComment,
  updateComment,
  toggleCommentLike
} from "./comments.service";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/reviews/{reviewId}/comments",
  tags: ["Comments"],
  summary: "List comments for a review",
  parameters: [
    { name: "reviewId", in: "path", required: true, schema: { type: "string" } }
  ],
  request: {
    query: commentQuerySchema
  },
  responses: {
    200: {
      description: "Comments",
      content: {
        "application/json": {
          schema: paginatedCommentsSchema
        }
      }
    }
  }
});

router.get(
  "/reviews/:reviewId/comments",
  validate({ query: commentQuerySchema }),
  async (req, res) => {
    const comments = await listComments(
      req.params.reviewId,
      req.query as Record<string, string>
    );
    return successResponse(res, { message: "ok", payload: comments });
  }
);

registry.registerPath({
  method: "post",
  path: "/reviews/{reviewId}/comments",
  tags: ["Comments"],
  summary: "Create review comment",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "reviewId", in: "path", required: true, schema: { type: "string" } }
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createCommentSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: "Created",
      content: {
        "application/json": {
          schema: commentResponseSchema
        }
      }
    }
  }
});

router.post(
  "/reviews/:reviewId/comments",
  authenticate,
  validate({ body: createCommentSchema }),
  async (req, res) => {
    const comment = await createComment(
      req.params.reviewId,
      req.user!.sub,
      req.body
    );
    return successResponse(res, {
      status: 201,
      message: "댓글이 등록되었습니다.",
      payload: comment
    });
  }
);

registry.registerPath({
  method: "patch",
  path: "/comments/{id}",
  tags: ["Comments"],
  summary: "Update own comment",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateCommentSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: "Updated comment",
      content: {
        "application/json": {
          schema: commentResponseSchema
        }
      }
    }
  }
});

router.patch(
  "/comments/:id",
  authenticate,
  validate({ body: updateCommentSchema }),
  async (req, res) => {
    const comment = await updateComment(
      req.params.id,
      req.user!.sub,
      req.body
    );
    return successResponse(res, {
      message: "댓글이 수정되었습니다.",
      payload: comment
    });
  }
);

registry.registerPath({
  method: "delete",
  path: "/comments/{id}",
  tags: ["Comments"],
  summary: "Delete own comment",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    200: {
      description: "Deleted",
      content: {
        "application/json": {
          schema: errorResponseSchema
        }
      }
    }
  }
});

router.delete("/comments/:id", authenticate, async (req, res) => {
  await deleteComment(req.params.id, req.user!.sub);
  return successResponse(res, {
    message: "댓글이 삭제되었습니다.",
    payload: { commentId: req.params.id }
  });
});

registry.registerPath({
  method: "post",
  path: "/comments/{id}/like",
  tags: ["Comments"],
  summary: "Like or unlike a comment",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  request: {
    query: z.object({
      like: z
        .string()
        .optional()
        .describe("Send 'false' to remove a like instead of toggling on")
    })
  },
  responses: {
    200: {
      description: "Updated comment with like count",
      content: {
        "application/json": {
          schema: commentResponseSchema
        }
      }
    }
  }
});

router.post("/comments/:id/like", authenticate, async (req, res) => {
  const likeParam = req.query.like;
  const like =
    typeof likeParam === "string" ? likeParam !== "false" : req.body.like !== false;
  const comment = await toggleCommentLike(req.params.id, req.user!.sub, like);
  return successResponse(res, {
    message: like ? "댓글을 추천했습니다." : "댓글 추천을 취소했습니다.",
    payload: comment
  });
});

export const commentsRouter = router;
