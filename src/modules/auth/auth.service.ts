import jwt, { type JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@core/prisma";
import { ApiError, ERROR_CODES } from "@core/errors";
import { comparePassword } from "@utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "@utils/jwt";
import { findUserByEmail } from "@modules/users/users.service";
import { env } from "@config/env";
import { durationToSeconds } from "@utils/duration";
import { recordActivity } from "@utils/activity-log";

const getExpiryFromToken = (token: string) => {
  const payload = jwt.decode(token) as JwtPayload | null;
  if (payload?.exp) {
    return new Date(payload.exp * 1000);
  }
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

interface TokenMetadata {
  userAgent?: string;
  ip?: string;
}

export const login = async (
  email: string,
  password: string,
  metadata: TokenMetadata = {}
) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(ERROR_CODES.UNAUTHORIZED, "Invalid credentials", {
      status: StatusCodes.UNAUTHORIZED
    });
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Account disabled", {
      status: StatusCodes.FORBIDDEN
    });
  }

  const passwordValid = await comparePassword(password, user.passwordHash);

  if (!passwordValid) {
    throw new ApiError(ERROR_CODES.UNAUTHORIZED, "Invalid credentials", {
      status: StatusCodes.UNAUTHORIZED
    });
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  const refreshExpiresAt = getExpiryFromToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshExpiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ip
    }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });
  await recordActivity(user.id, "USER_LOGGED_IN", { email: user.email });

  const { passwordHash, ...safeUser } = user;

  const expiresIn = durationToSeconds(env.ACCESS_TOKEN_TTL);
  const issuedAt = new Date();
  const accessTokenExpiresAt = new Date(
    issuedAt.getTime() + expiresIn * 1000
  );

  return {
    accessToken,
    refreshToken,
    expiresIn,
    issuedAt,
    accessTokenExpiresAt,
    refreshTokenExpiresAt: refreshExpiresAt,
    user: safeUser
  };
};

export const rotateToken = async (
  refreshToken: string,
  metadata: TokenMetadata = {}
) => {
  verifyRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
      revoked: false
    },
    include: { user: true }
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new ApiError(ERROR_CODES.TOKEN_EXPIRED, "Refresh token expired", {
      status: StatusCodes.UNAUTHORIZED
    });
  }

  const user = stored.user;

  const newAccessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });
  const newRefreshToken = signRefreshToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  const refreshExpiresAt = getExpiryFromToken(newRefreshToken);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true }
    }),
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: refreshExpiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ip
      }
    })
  ]);

  const { passwordHash, ...safeUser } = user;

  const expiresIn = durationToSeconds(env.ACCESS_TOKEN_TTL);
  const issuedAt = new Date();
  const accessTokenExpiresAt = new Date(
    issuedAt.getTime() + expiresIn * 1000
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn,
    issuedAt,
    accessTokenExpiresAt,
    refreshTokenExpiresAt: refreshExpiresAt,
    user: safeUser
  };
};

export const logout = async (refreshToken: string) => {
  try {
    verifyRefreshToken(refreshToken);
  } catch {
    // ignore invalid token for logout
  }
  const stored = await prisma.refreshToken.findFirst({
    where: { token: refreshToken }
  });
  const revokedAt = new Date();
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revoked: true }
  });
  return {
    userId: stored?.userId,
    revokedAt
  };
};
