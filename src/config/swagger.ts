import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { env } from "@config/env";

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
