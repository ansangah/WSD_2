import pino from "pino";
import { env } from "@config/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["set-cookie"]',
      'req.body.password',
      'req.body.refreshToken',
      'req.body.passwordHash',
      'res.headers["set-cookie"]'
    ],
    censor: "[REDACTED]"
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard"
          }
        }
      : undefined
});
