import { Router } from "express";
import { commonErrorResponses, registry } from "@config/swagger";
import { authenticate, requireRoles } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { successResponse } from "@utils/api-response";
import {
  activityLogResponseSchema,
  paginatedActivityLogSchema,
  activityLogQuerySchema
} from "./activity-logs.schemas";
import { listActivityLogs } from "./activity-logs.service";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/activity-logs",
  tags: ["Activity Logs"],
  summary: "감사 로그 목록 조회(관리자)",
  security: [{ bearerAuth: [] }],
  request: {
    query: activityLogQuerySchema
  },
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "로그",
      content: {
        "application/json": {
          schema: paginatedActivityLogSchema
        }
      }
    }
  }
});

router.get(
  "/",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  validate({ query: activityLogQuerySchema }),
  async (req, res) => {
    const logs = await listActivityLogs(req.query as Record<string, string>);
    return successResponse(res, { message: "ok", payload: logs });
  }
);

export const activityLogsRouter = router;
