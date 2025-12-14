import jwt, { SignOptions } from "jsonwebtoken";
import type { UserRole } from "@core/prisma-client";
import { env } from "@config/env";
import { ApiError, ERROR_CODES } from "@core/errors";
import { StatusCodes } from "http-status-codes";

export interface TokenPayload {
  sub: string;
  role: UserRole;
  email: string;
  type: "access" | "refresh";
}

const signToken = (
  payload: TokenPayload,
  secret: string,
  expiresIn: string
) => {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"]
  };
  return jwt.sign(payload, secret, options);
};

export const signAccessToken = (payload: Omit<TokenPayload, "type">) =>
  signToken(
    { ...payload, type: "access" },
    env.JWT_ACCESS_SECRET,
    env.ACCESS_TOKEN_TTL
  );

export const signRefreshToken = (payload: Omit<TokenPayload, "type">) =>
  signToken(
    { ...payload, type: "refresh" },
    env.JWT_REFRESH_SECRET,
    env.REFRESH_TOKEN_TTL
  );

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    throw new ApiError(ERROR_CODES.UNAUTHORIZED, "Invalid or expired token", {
      status: StatusCodes.UNAUTHORIZED,
      cause: error instanceof Error ? error : undefined
    });
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    throw new ApiError(ERROR_CODES.TOKEN_EXPIRED, "Invalid refresh token", {
      status: StatusCodes.UNAUTHORIZED,
      cause: error instanceof Error ? error : undefined
    });
  }
};
