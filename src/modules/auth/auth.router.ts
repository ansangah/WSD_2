import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { commonErrorResponses, registry, errorResponseSchema } from "@config/swagger";
import { validate } from "@middleware/validate";
import {
  loginSchema,
  refreshSchema,
  authResponseSchema,
  logoutSchema
} from "./auth.schemas";
import { login, rotateToken, logout } from "./auth.service";
import { successResponse } from "@utils/api-response";

const router = Router();

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Authenticate user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema
        }
      }
    }
  },
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Tokens issued",
      content: {
        "application/json": {
          schema: authResponseSchema
        }
      }
    },
    401: {
      description: "Invalid credentials",
      content: {
        "application/json": {
          schema: errorResponseSchema
        }
      }
    }
  }
});

const formatAuthUser = (user: {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  status: string;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name ?? null,
  role: user.role,
  status: user.status
});

router.post("/login", validate({ body: loginSchema }), async (req, res) => {
  const result = await login(req.body.email, req.body.password, {
    userAgent: req.get("user-agent") ?? undefined,
    ip: req.ip
  });
  return successResponse(res, {
    message: "로그인되었습니다.",
    payload: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenType: "Bearer",
      expiresIn: result.expiresIn,
      issuedAt: result.issuedAt.toISOString(),
      user: formatAuthUser(result.user)
    }
  });
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh JWT tokens",
  request: {
    body: {
      content: {
        "application/json": {
          schema: refreshSchema
        }
      }
    }
  },
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Tokens rotated",
      content: {
        "application/json": {
          schema: authResponseSchema
        }
      }
    }
  }
});

router.post(
  "/refresh",
  validate({ body: refreshSchema }),
  async (req, res) => {
    const result = await rotateToken(req.body.refreshToken, {
      userAgent: req.body.userAgent ?? req.get("user-agent") ?? undefined,
      ip: req.body.ip ?? req.ip
    });
    return successResponse(res, {
      message: "토큰이 갱신되었습니다.",
      payload: {
        accessToken: result.accessToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt.toISOString(),
        refreshToken: result.refreshToken,
        refreshTokenExpiresAt: result.refreshTokenExpiresAt.toISOString(),
        userId: result.user.id
      }
    });
  }
);

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Logout and revoke refresh token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: refreshSchema
        }
      }
    }
  },
  responses: {
    ...commonErrorResponses(),
    204: {
      description: "Logged out"
    }
  }
});

router.post(
  "/logout",
  validate({ body: logoutSchema }),
  async (req, res) => {
    const result = await logout(req.body.refreshToken);
    return successResponse(res, {
      message: "로그아웃이 완료되었습니다.",
      payload: {
        userId: result.userId,
        revokedAt: result.revokedAt.toISOString()
      }
    });
  }
);

export const authRouter = router;
