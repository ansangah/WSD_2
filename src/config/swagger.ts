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
    message: "Bad request",
    details: { reason: "Invalid query parameter" }
  },
  401: {
    timestamp: EXAMPLE_TIMESTAMP,
    path: EXAMPLE_PATH,
    status: 401,
    code: ERROR_CODES.UNAUTHORIZED,
    message: "Unauthorized"
  },
  403: {
    timestamp: EXAMPLE_TIMESTAMP,
    path: EXAMPLE_PATH,
    status: 403,
    code: ERROR_CODES.FORBIDDEN,
    message: "Forbidden"
  },
  404: {
    timestamp: EXAMPLE_TIMESTAMP,
    path: EXAMPLE_PATH,
    status: 404,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: "The requested resource could not be found"
  },
  422: {
    timestamp: EXAMPLE_TIMESTAMP,
    path: EXAMPLE_PATH,
    status: 422,
    code: ERROR_CODES.VALIDATION_FAILED,
    message: "Validation failed",
    details: {
      fieldErrors: { email: ["Invalid email"], password: ["Too short"] }
    }
  },
  500: {
    timestamp: EXAMPLE_TIMESTAMP,
    path: EXAMPLE_PATH,
    status: 500,
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: "Unexpected error"
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
  400: errorResponse(400, "Bad request"),
  401: errorResponse(401, "Unauthorized"),
  403: errorResponse(403, "Forbidden"),
  404: errorResponse(404, "Not found"),
  422: errorResponse(422, "Validation failed"),
  500: errorResponse(500, "Internal server error")
});

export const getOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  const baseDocument = generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "WSD Assignment API",
      version: "1.0.0",
      description:
        "Comprehensive bookstore API implementing authentication, RBAC, pagination, validation, and statistics."
    },
    servers: [
      {
        url: "http://113.198.66.68:10237",
        description: "JCloud deployment"
      },
      {
        url: "http://localhost:{port}",
        description: "Local development",
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
