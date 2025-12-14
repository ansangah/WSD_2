import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { env } from "@config/env";
import { ERROR_CODES } from "@core/errors";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const errorResponseSchema = registry.register("ErrorResponse", z.object({
  timestamp: z.string(),
  path: z.string(),
  status: z.number(),
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional()
}));

type ErrorResponseExample = {
  timestamp: string;
  path: string;
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

const EXAMPLE_TIMESTAMP = "2025-01-01T00:00:00.000Z";
const EXAMPLE_PATH = "/example/path";

const errorExamples: Record<
  400 | 401 | 403 | 404 | 422 | 500,
  ErrorResponseExample
> = {
  400: {
    timestamp: EXAMPLE_TIMESTAMP,
    path: EXAMPLE_PATH,
    status: 400,
    code: ERROR_CODES.BAD_REQUEST,
    message: "잘못된 요청",
    details: { reason: "쿼리 파라미터 형식이 잘못되었습니다." }
  },
  401: {
    timestamp: EXAMPLE_TIMESTAMP,
    path: EXAMPLE_PATH,
    status: 401,
    code: ERROR_CODES.UNAUTHORIZED,
    message: "인증되지 않았습니다."
  },
  403: {
    timestamp: EXAMPLE_TIMESTAMP,
    path: EXAMPLE_PATH,
    status: 403,
    code: ERROR_CODES.FORBIDDEN,
    message: "접근 권한이 없습니다."
  },
  404: {
    timestamp: EXAMPLE_TIMESTAMP,
    path: EXAMPLE_PATH,
    status: 404,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: "요청한 리소스를 찾을 수 없습니다."
  },
  422: {
    timestamp: EXAMPLE_TIMESTAMP,
    path: EXAMPLE_PATH,
    status: 422,
    code: ERROR_CODES.VALIDATION_FAILED,
    message: "유효성 검사가 실패했습니다.",
    details: {
      fieldErrors: {
        email: ["잘못된 이메일 형식"],
        password: ["비밀번호가 너무 짧습니다"]
      }
    }
  },
  500: {
    timestamp: EXAMPLE_TIMESTAMP,
    path: EXAMPLE_PATH,
    status: 500,
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: "예상치 못한 오류가 발생했습니다."
  }
};

const errorResponse = (
  status: 400 | 401 | 403 | 404 | 422 | 500,
  description: string
) => ({
  description,
  content: {
    "application/json": {
      schema: errorResponseSchema,
      examples: {
        example: {
          value: errorExamples[status]
        }
      }
    }
  }
});

export const commonErrorResponses = () => ({
  400: errorResponse(400, "잘못된 요청"),
  401: errorResponse(401, "인증 실패"),
  403: errorResponse(403, "접근 권한 없음"),
  404: errorResponse(404, "찾을 수 없음"),
  422: errorResponse(422, "요청 처리 불가"),
  500: errorResponse(500, "서버 내부 오류")
});

export const getOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  const baseDocument = generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "WSD 과제 API",
      version: "1.0.0",
      description: "서점 API 명세입니다."
    },
    servers: [
      {
        url: "http://113.198.66.68:10237",
        description: "JCloud 배포본"
      },
      {
        url: "http://localhost:{port}",
        description: "로컬 개발 환경",
        variables: {
          port: {
            default: env.PORT.toString()
          }
        }
      }
    ],
    tags: [
      { name: "Auth" },
      { name: "Users" },
      { name: "Categories" },
      { name: "Books" },
      { name: "Orders" },
      { name: "Reviews" },
      { name: "Stats" },
      { name: "Health" }
    ]
  });
  const components = generator.generateComponents();

  return {
    ...baseDocument,
    components: {
      ...(components.components ?? {}),
      securitySchemes: {
        ...(components.components?.securitySchemes ?? {}),
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  };
};
