import { Prisma } from "@core/prisma-client";
import { prisma } from "@core/prisma";
import { ApiError, ERROR_CODES } from "@core/errors";
import { StatusCodes } from "http-status-codes";
import {
  getPaginationParams,
  buildPaginationResponse
} from "@utils/pagination";
import type { z } from "zod";
import { authorQuerySchema } from "./authors.schemas";

type AuthorQuery = z.infer<typeof authorQuerySchema>;

export const listAuthors = async (query: AuthorQuery) => {
  const { page, size, skip, take, sort } = getPaginationParams(query);
  const where: Prisma.AuthorWhereInput = query.keyword
    ? {
        OR: [
          { name: { contains: query.keyword } },
          { biography: { contains: query.keyword } }
        ]
      }
    : {};
  const orderBy = sort
    ? (() => {
        const [field, direction] = sort.split(",");
        return {
          [field || "createdAt"]:
            (direction ?? "asc").toLowerCase() === "desc" ? "desc" : "asc"
        };
      })()
    : { name: "asc" as const };

  const [items, total] = await prisma.$transaction([
    prisma.author.findMany({
      where,
      skip,
      take,
      orderBy
    }),
    prisma.author.count({ where })
  ]);

  return buildPaginationResponse(items, total, page, size, sort);
};

export const getAuthorDetail = async (id: string) => {
  const author = await prisma.author.findUnique({
    where: { id },
    include: {
      books: {
        orderBy: { authorOrder: "asc" },
        include: {
          book: {
            select: { id: true, title: true, publishedAt: true }
          }
        }
      }
    }
  });
  if (!author) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Author not found", {
      status: StatusCodes.NOT_FOUND
    });
  }
  return {
    id: author.id,
    name: author.name,
    biography: author.biography,
    books: author.books.map((entry) => ({
      id: entry.book.id,
      title: entry.book.title,
      publishedAt: entry.book.publishedAt
        ? entry.book.publishedAt.toISOString()
        : null
    }))
  };
};
