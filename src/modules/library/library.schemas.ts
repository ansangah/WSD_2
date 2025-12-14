import { z } from "zod";
import { registry } from "@config/swagger";

export const addLibrarySchema = registry.register(
  "AddLibraryInput",
  z.object({
    bookId: z.string(),
    source: z.string().optional()
  })
);

export const libraryItemSchema = registry.register(
  "LibraryItem",
  z.object({
    id: z.string(),
    bookId: z.string(),
    title: z.string(),
    acquiredAt: z.string(),
    source: z.string().nullable()
  })
);

export const libraryListResponseSchema = registry.register(
  "LibraryListResponse",
  z.object({
    items: z.array(libraryItemSchema)
  })
);
