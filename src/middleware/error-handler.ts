import type { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@core/prisma-client";
import { ApiError, ERROR_CODES, isApiError } from "@core/errors";
import { logger } from "@core/logger";

export const errorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  _next
) => {
  let apiError: ApiError;

  if (isApiError(err)) {
    apiError = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      apiError = new ApiError(
        ERROR_CODES.DUPLICATE_RESOURCE,
        "Duplicate resource",
        {
          status: StatusCodes.CONFLICT,
          details: { target: err.meta?.target }
        }
      );
    } else if (err.code === "P2003") {
      apiError = new ApiError(
        ERROR_CODES.STATE_CONFLICT,
        "Invalid reference",
        {
          status: StatusCodes.CONFLICT,
          details: err.meta as Record<string, unknown>
        }
      );
    } else {
      apiError = new ApiError(ERROR_CODES.DATABASE_ERROR, err.message, {
        status: StatusCodes.INTERNAL_SERVER_ERROR
      });
    }
  } else {
    apiError = new ApiError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      err?.message ?? "Unexpected error",
      {
        status: StatusCodes.INTERNAL_SERVER_ERROR
      }
    );
  }

  logger.error(
    {
      err,
      path: req.originalUrl,
      method: req.method,
      status: apiError.status
    },
    apiError.message
  );

  res.status(apiError.status).json({
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    status: apiError.status,
    code: apiError.code,
    message: apiError.message,
    details: apiError.details
  });
};
