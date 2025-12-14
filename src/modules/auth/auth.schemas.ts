import { z } from "zod";
import { registry } from "@config/swagger";
import { userResponseSchema } from "@modules/users/users.schemas";

export const loginSchema = registry.register(
  "LoginInput",
  z.object({
    email: z.string().email(),
    password: z.string().min(8),
    rememberMe: z.boolean().optional()
  })
);

export const refreshSchema = registry.register(
  "RefreshInput",
  z.object({
    refreshToken: z.string().min(10),
    userAgent: z.string().optional(),
    ip: z.string().optional()
  })
);

export const logoutSchema = registry.register(
  "LogoutInput",
  z.object({
    refreshToken: z.string().min(10),
    userAgent: z.string().optional(),
    ip: z.string().optional()
  })
);

export const authResponseSchema = registry.register(
  "AuthResponse",
  z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    tokenType: z.literal("Bearer").default("Bearer"),
    expiresIn: z.number(),
    user: userResponseSchema
  })
);
