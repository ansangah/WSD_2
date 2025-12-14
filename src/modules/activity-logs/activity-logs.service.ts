import { prisma } from "@core/prisma";
import {
  getPaginationParams,
  buildPaginationResponse
} from "@utils/pagination";
import type { z } from "zod";
import { activityLogQuerySchema } from "./activity-logs.schemas";

type ActivityLogQuery = z.infer<typeof activityLogQuerySchema>;

export const listActivityLogs = async (query: ActivityLogQuery) => {
  const { page, size, skip, take, sort } = getPaginationParams(query);
  const where = {
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.action ? { action: query.action } : {})
  };
  const orderBy = sort
    ? (() => {
        const [field, direction] = sort.split(",");
        return {
          [field || "createdAt"]:
            (direction ?? "desc").toLowerCase() === "asc" ? "asc" : "desc"
        };
      })()
    : { createdAt: "desc" as const };
  const [items, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      skip,
      take,
      orderBy
    }),
    prisma.activityLog.count({ where })
  ]);
  return buildPaginationResponse(items, total, page, size, sort);
};
