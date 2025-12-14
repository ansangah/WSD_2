import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";

export const ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INVALID_QUERY_PARAM: "INVALID_QUERY_PARAM",
  UNAUTHORIZED: "UNAUTHORIZED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  STATE_CONFLICT: "STATE_CONFLICT",
  UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ErrorOptions {
  status?: number;
  details?: Record<string, unknown>;
  cause?: Error;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, options: ErrorOptions = {}) {
    super(message);
    if (options.cause) {
      (this as Error & { cause?: Error }).cause = options.cause;
    }
    this.code = code;
    this.status = options.status ?? StatusCodes.BAD_REQUEST;
    this.details = options.details;
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

export const validationError = (error: ZodError) =>
  new ApiError(ERROR_CODES.VALIDATION_FAILED, "Validation failed", {
    status: StatusCodes.UNPROCESSABLE_ENTITY,
    details: error.flatten()
  });
