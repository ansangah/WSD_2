import { Response } from "express";

interface SuccessOptions<T> {
  status?: number;
  message?: string;
  payload?: T;
}

export const successResponse = <T>(
  res: Response,
  { status = 200, message = "ok", payload }: SuccessOptions<T>
) =>
  res.status(status).json({
    isSuccess: true,
    message,
    payload
  });
