import { z } from "zod";
import { registry } from "@config/swagger";

export const categoryResponseSchema = registry.register(
  "Category",
  z.object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
  })
);

export const createCategorySchema = registry.register(
  "CreateCategoryInput",
  z.object({
    name: z.string().min(2),
    parentId: z.string().optional()
  })
);

export const updateCategorySchema = registry.register(
  "UpdateCategoryInput",
  z.object({
    name: z.string().min(2).optional(),
    parentId: z.string().optional()
  })
);
