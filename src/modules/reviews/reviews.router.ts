import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { commonErrorResponses, registry } from "@config/swagger";
import { authenticate, requireRoles } from "@middleware/auth";
import { validate } from "@middleware/validate";
import {
  reviewResponseSchema,
  reviewQuerySchema,
  updateReviewSchema,
  topReviewsQuerySchema
} from "./reviews.schemas";
import {
  listReviews,
  getReviewById,
  moderateReview,
  updateReviewContent,
  deleteReview,
  setReviewLike,
  listTopReviews
} from "./reviews.service";
import { successResponse } from "@utils/api-response";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/reviews",
  tags: ["Reviews"],
  summary: "리뷰 목록 조회(관리자)",
  security: [{ bearerAuth: [] }],
  request: {
    query: reviewQuerySchema
  },
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Review list",
      content: {
        "application/json": {
          schema: z.object({
            content: z.array(reviewResponseSchema),
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
  "/",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  validate({ query: reviewQuerySchema }),
  async (req, res) => {
    const result = await listReviews(req.query as Record<string, string>);
    return successResponse(res, { message: "ok", payload: result });
  }
);

registry.registerPath({
  method: "get",
  path: "/reviews/top",
  tags: ["Reviews"],
  summary: "좋아요 많은 리뷰",
  request: {
    query: topReviewsQuerySchema
  },
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Top review list",
      content: {
        "application/json": {
          schema: z.array(reviewResponseSchema)
        }
      }
    }
  }
});

router.get(
  "/top",
  validate({ query: topReviewsQuerySchema }),
  async (req, res) => {
    const reviews = await listTopReviews(
      req.query as Record<string, string>
    );
    return successResponse(res, { message: "ok", payload: reviews });
  }
);

registry.registerPath({
  method: "get",
  path: "/reviews/{id}",
  tags: ["Reviews"],
  summary: "리뷰 상세 조회",
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Review",
      content: {
        "application/json": {
          schema: reviewResponseSchema
        }
      }
    }
  }
});

router.get("/:id", async (req, res) => {
  const review = await getReviewById(req.params.id);
  return successResponse(res, { message: "ok", payload: review });
});

registry.registerPath({
  method: "patch",
  path: "/reviews/{id}",
  tags: ["Reviews"],
  summary: "내 리뷰 수정",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateReviewSchema
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
      description: "Updated review",
      content: {
        "application/json": {
          schema: reviewResponseSchema
        }
      }
    }
  }
});

router.patch(
  "/:id",
  authenticate,
  validate({ body: updateReviewSchema }),
  async (req, res) => {
    const review = await updateReviewContent(
      req.params.id,
      req.user!.sub,
      req.body
    );
    return successResponse(res, {
      message: "리뷰가 수정되었습니다.",
      payload: review
    });
  }
);

registry.registerPath({
  method: "delete",
  path: "/reviews/{id}",
  tags: ["Reviews"],
  summary: "내 리뷰 삭제",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    204: {
      description: "Deleted"
    }
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  await deleteReview(req.params.id, req.user!.sub);
  return res.status(StatusCodes.NO_CONTENT).send();
});

registry.registerPath({
  method: "patch",
  path: "/reviews/{id}/status",
  tags: ["Reviews"],
  summary: "리뷰 상태 조정",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            hidden: z.boolean()
          })
        }
      }
    }
  },
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Updated review",
      content: {
        "application/json": {
          schema: reviewResponseSchema
        }
      }
    }
  }
});

router.patch(
  "/:id/status",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  validate({ body: z.object({ hidden: z.boolean() }) }),
  async (req, res) => {
    const review = await moderateReview(req.params.id, req.body.hidden);
    return successResponse(res, {
      message: "리뷰 상태가 업데이트되었습니다.",
      payload: review
    });
  }
);

registry.registerPath({
  method: "post",
  path: "/reviews/{id}/likes",
  tags: ["Reviews"],
  summary: "리뷰 좋아요",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Review with updated like count",
      content: {
        "application/json": {
          schema: reviewResponseSchema
        }
      }
    }
  }
});

router.post("/:id/likes", authenticate, async (req, res) => {
  const review = await setReviewLike(req.params.id, req.user!.sub, true);
  return successResponse(res, {
    message: "리뷰에 좋아요를 남겼습니다.",
    payload: review
  });
});

registry.registerPath({
  method: "delete",
  path: "/reviews/{id}/likes",
  tags: ["Reviews"],
  summary: "리뷰 좋아요 취소",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Review with updated like count",
      content: {
        "application/json": {
          schema: reviewResponseSchema
        }
      }
    }
  }
});

router.delete("/:id/likes", authenticate, async (req, res) => {
  const review = await setReviewLike(req.params.id, req.user!.sub, false);
  return successResponse(res, {
    message: "리뷰 좋아요가 취소되었습니다.",
    payload: review
  });
});

export const reviewsRouter = router;
