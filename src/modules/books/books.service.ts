import { Prisma } from "@core/prisma-client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@core/prisma";
import { ApiError, ERROR_CODES } from "@core/errors";
import {
  getPaginationParams,
  buildPaginationResponse
} from "@utils/pagination";
import type { createBookSchema, updateBookSchema } from "./books.schemas";
import { z } from "zod";

type CreateBookInput = z.infer<typeof createBookSchema>;
type UpdateBookInput = z.infer<typeof updateBookSchema>;

const bookInclude = {
  authors: {
    include: {
      author: true
    }
  },
  categories: {
    include: {
      category: true
    }
  }
} as const;

const normalizeBook = (book: any) => ({
  ...book,
  authors: book.authors?.map((entry: any) => entry.author) ?? [],
  categories: book.categories?.map((entry: any) => entry.category) ?? []
});

export const createBook = async (input: CreateBookInput) => {
  const book = await prisma.book.create({
    data: {
      isbn13: input.isbn13,
      title: input.title,
      description: input.description,
      price: new Prisma.Decimal(input.price),
      stock: input.stock,
      languageCode: input.languageCode,
      pageCount: input.pageCount,
      coverUrl: input.coverUrl,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined
    }
  });

  if (input.authorIds?.length) {
    await prisma.bookAuthor.createMany({
      data: input.authorIds.map((authorId, index) => ({
        bookId: book.id,
        authorId,
        authorOrder: index + 1
      }))
    });
  }

  if (input.categoryIds?.length) {
    await prisma.bookCategory.createMany({
      data: input.categoryIds.map((categoryId) => ({
        bookId: book.id,
        categoryId
      }))
    });
  }

  const full = await prisma.book.findUnique({
    where: { id: book.id },
    include: bookInclude
  });

  return normalizeBook(full);
};

const allowedSortFields = ["publishedAt", "avgRating", "price", "createdAt"];

const toDecimal = (value?: string) =>
  value ? new Prisma.Decimal(value) : undefined;

export const listBooks = async (query: Record<string, string | undefined>) => {
  const { page, size, skip, take } = getPaginationParams(query);
  const keyword = query.q ?? query.keyword;
  const where: Prisma.BookWhereInput = {
    deletedAt: null,
    ...(keyword
      ? {
          OR: [
            { title: { contains: keyword } },
            { description: { contains: keyword } }
          ]
        }
      : {}),
    ...(query.categoryId
      ? { categories: { some: { categoryId: query.categoryId } } }
      : {}),
    ...(query.authorId
      ? { authors: { some: { authorId: query.authorId } } }
      : {}),
    ...(query.languageCode ? { languageCode: query.languageCode } : {}),
    ...(query.minPrice || query.maxPrice
      ? {
          price: {
            gte: toDecimal(query.minPrice),
            lte: toDecimal(query.maxPrice)
          }
        }
      : {}),
    ...(query.minRating
      ? { avgRating: { gte: toDecimal(query.minRating) } }
      : {})
  };

  const sortField = allowedSortFields.includes(query.sort ?? "")
    ? (query.sort as keyof Prisma.BookOrderByWithRelationInput)
    : ("createdAt" as const);
  const orderDirection =
    query.order?.toLowerCase() === "asc" ? "asc" : ("desc" as const);
  const orderBy: Prisma.BookOrderByWithRelationInput = {
    [sortField]: orderDirection
  };

  const includeTokens = new Set(
    (query.include ?? "authors,categories")
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean)
  );
  const includeAuthors =
    !query.include || includeTokens.has("authors") || includeTokens.has("*");
  const includeCategories =
    !query.include || includeTokens.has("categories") || includeTokens.has("*");

  const include: Prisma.BookInclude | undefined =
    includeAuthors || includeCategories
      ? {
          ...(includeAuthors ? { authors: bookInclude.authors } : {}),
          ...(includeCategories ? { categories: bookInclude.categories } : {})
        }
      : undefined;

  const [items, total] = await prisma.$transaction([
    prisma.book.findMany({
      where,
      skip,
      take,
      orderBy,
      include
    }),
    prisma.book.count({ where })
  ]);

  return buildPaginationResponse(
    items.map(normalizeBook),
    total,
    page,
    size,
    `${sortField},${orderDirection}`
  );
};

export const getBookById = async (id: string) => {
  const book = await prisma.book.findFirst({
    where: { id, deletedAt: null },
    include: {
      ...bookInclude,
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true } }
        }
      }
    }
  });
  if (!book) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Book not found", {
      status: StatusCodes.NOT_FOUND
    });
  }
  return normalizeBook(book);
};

export const updateBook = async (id: string, input: UpdateBookInput) => {
  await getBookById(id);
  const updated = await prisma.book.update({
    where: { id },
    data: {
      isbn13: input.isbn13 ?? undefined,
      title: input.title ?? undefined,
      description: input.description ?? undefined,
      price: input.price ? new Prisma.Decimal(input.price) : undefined,
      stock: input.stock ?? undefined,
      languageCode: input.languageCode ?? undefined,
      pageCount: input.pageCount ?? undefined,
      coverUrl: input.coverUrl ?? undefined,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined
    }
  });

  if (input.authorIds) {
    await prisma.bookAuthor.deleteMany({ where: { bookId: id } });
    if (input.authorIds.length > 0) {
      await prisma.bookAuthor.createMany({
        data: input.authorIds.map((authorId, index) => ({
          bookId: id,
          authorId,
          authorOrder: index + 1
        }))
      });
    }
  }

  if (input.categoryIds) {
    await prisma.bookCategory.deleteMany({ where: { bookId: id } });
    if (input.categoryIds.length > 0) {
      await prisma.bookCategory.createMany({
        data: input.categoryIds.map((categoryId) => ({
          bookId: id,
          categoryId
        }))
      });
    }
  }

  const full = await prisma.book.findUnique({
    where: { id: updated.id },
    include: bookInclude
  });
  return normalizeBook(full);
};

export const archiveBook = async (id: string) => {
  await getBookById(id);
  await prisma.book.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
};

export const getRelatedBooks = async (bookId: string) => {
  const categories = await prisma.bookCategory.findMany({
    where: { bookId }
  });
  const categoryIds = categories.map((entry) => entry.categoryId);
  if (categoryIds.length === 0) {
    return [];
  }
  const books = await prisma.book.findMany({
    where: {
      deletedAt: null,
      id: { not: bookId },
      categories: { some: { categoryId: { in: categoryIds } } }
    },
    take: 5,
    orderBy: { createdAt: "desc" }
  });
  return books;
};
