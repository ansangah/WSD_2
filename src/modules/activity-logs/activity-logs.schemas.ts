import { z } from "zod";
import { registry } from "@config/swagger";

export const activityLogResponseSchema = registry.register(
  "ActivityLogResponse",
  z.object({
    id: z.string(),
    userId: z.string().nullable(),
    action: z.string(),
    ip: z.string().nullable(),
    createdAt: z.string(),
    metadata: z.record(z.string(), z.any()).nullable()
  })
);

export const activityLogQuerySchema = registry.register(
  "ActivityLogQuery",
  z.object({
    page: z.string().optional(),
    size: z.string().optional(),
    sort: z.string().optional(),
    userId: z.string().optional(),
    action: z.string().optional()
  })
);

export const paginatedActivityLogSchema = registry.register(
  "PaginatedActivityLogs",
  z.object({
    content: z.array(activityLogResponseSchema),
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    sort: z.string().optional().nullable()
  })
);
