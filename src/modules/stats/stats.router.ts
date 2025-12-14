import { Router } from "express";
import { z } from "zod";
import { registry } from "@config/swagger";
import { authenticate, requireRoles } from "@middleware/auth";
import { getOverviewStats, getTopBooks, getDailySales } from "./stats.service";
import { successResponse } from "@utils/api-response";

const router = Router();

const overviewSchema = registry.register(
  "StatsOverview",
  z.object({
    totalUsers: z.number(),
    totalBooks: z.number(),
    totalOrders: z.number(),
    totalRevenue: z.string(),
    averageOrderValue: z.string(),
    totalReviews: z.number()
  })
);

registry.registerPath({
  method: "get",
  path: "/stats/overview",
  tags: ["Stats"],
  summary: "Global KPIs",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Overview metrics",
      content: {
        "application/json": {
          schema: overviewSchema
        }
      }
    }
  }
});

router.get(
  "/overview",
  authenticate,
  requireRoles("ADMIN"),
  async (_req, res) => {
    const stats = await getOverviewStats();
    return successResponse(res, {
      message: "ok",
      payload: {
        ...stats,
        totalRevenue: stats.totalRevenue.toString(),
        averageOrderValue: stats.averageOrderValue.toString()
      }
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/stats/top-books",
  tags: ["Stats"],
  summary: "Top selling books",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Top books",
      content: {
        "application/json": {
          schema: z
            .array(
              z.object({
                book: z
                  .object({
                    id: z.string(),
                    title: z.string()
                  })
                  .nullable(),
                quantity: z.number(),
                revenue: z.string(),
                orderCount: z.number()
              })
            )
            .openapi({ title: "TopBooks" })
        }
      }
    }
  }
});

router.get(
  "/top-books",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  async (_req, res) => {
    const books = await getTopBooks();
    return successResponse(res, { message: "ok", payload: books });
  }
);

registry.registerPath({
  method: "get",
  path: "/stats/daily-sales",
  tags: ["Stats"],
  summary: "Daily revenue (last 14 days)",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Daily revenue series",
      content: {
        "application/json": {
          schema: z
            .array(
              z.object({
                date: z.string(),
                revenue: z.string().nullable()
              })
            )
            .openapi({ title: "DailySales" })
        }
      }
    }
  }
});

router.get(
  "/daily-sales",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  async (_req, res) => {
    const series = await getDailySales();
    return successResponse(res, { message: "ok", payload: series });
  }
);

export const statsRouter = router;
