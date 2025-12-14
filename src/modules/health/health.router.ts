import { Router } from "express";
import os from "node:os";
import { registry } from "@config/swagger";
import { z } from "zod";

const router = Router();

const appVersion =
  process.env.APP_VERSION ??
  process.env.npm_package_version ??
  "unknown";
const buildTime = process.env.BUILD_TIME ?? "unknown";

const HealthResponseSchema = registry.register(
  "HealthResponse",
  z.object({
    status: z.literal("ok"),
    version: z.string(),
    buildTime: z.string(),
    uptime: z.number(),
    timestamp: z.string(),
    hostname: z.string()
  })
);

registry.registerPath({
  method: "get",
  path: "/health",
  tags: ["Health"],
  summary: "Service health information",
  responses: {
    200: {
      description: "Health status",
      content: {
        "application/json": {
          schema: HealthResponseSchema
        }
      }
    }
  }
});

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    version: appVersion,
    buildTime,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    hostname: os.hostname()
  });
});

export const healthRouter = router;
