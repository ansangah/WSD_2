import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { ERROR_CODES } from "@core/errors";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    status: StatusCodes.NOT_FOUND,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: "The requested resource could not be found"
  });
};
