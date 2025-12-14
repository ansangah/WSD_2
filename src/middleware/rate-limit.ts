import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";
import { env } from "@config/env";
import { ERROR_CODES } from "@core/errors";

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  legacyHeaders: false,
  standardHeaders: true,
  handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      status: StatusCodes.TOO_MANY_REQUESTS,
      code: ERROR_CODES.TOO_MANY_REQUESTS,
      message: "Too many requests. Please try again later."
    });
  }
});
