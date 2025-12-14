import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import type { UserRole } from "@core/prisma-client";
import { ApiError, ERROR_CODES } from "@core/errors";
import { verifyAccessToken } from "@utils/jwt";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(ERROR_CODES.UNAUTHORIZED, "Missing bearer token", {
      status: StatusCodes.UNAUTHORIZED
    });
  }

  const token = header.replace("Bearer ", "").trim();
  const payload = verifyAccessToken(token);
  req.user = payload;
  next();
};

export const requireRoles =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, "Authentication required", {
        status: StatusCodes.UNAUTHORIZED
      });
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(ERROR_CODES.FORBIDDEN, "Insufficient permissions", {
        status: StatusCodes.FORBIDDEN
      });
    }

    next();
  };
