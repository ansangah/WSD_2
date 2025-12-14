import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
import { validationError } from "@core/errors";

interface ValidateOptions {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

export const validate = (options: ValidateOptions): RequestHandler => {
  return (req, _res, next) => {
    try {
      if (options.body) {
        req.body = options.body.parse(req.body);
      }
      if (options.params) {
        req.params = options.params.parse(req.params) as typeof req.params;
      }
      if (options.query) {
        req.query = options.query.parse(req.query) as typeof req.query;
      }
      next();
    } catch (error) {
      if (error && typeof error === "object" && "issues" in error) {
        next(validationError(error as never));
        return;
      }
      next(error);
    }
  };
};
