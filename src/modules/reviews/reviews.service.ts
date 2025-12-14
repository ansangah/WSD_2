import { Prisma } from "@core/prisma-client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@core/prisma";
import { ApiError, ERROR_CODES } from "@core/errors";
import {
  getPaginationParams,
  buildPaginationResponse
} from "@utils/pagination";
import type { z } from "zod";
import {
  reviewQuerySchema,
  userReviewQuerySchema,
  bookReviewsQuerySchema,
  createReviewSchema,
  updateReviewSchema,
  topReviewsQuerySchema
} from "./reviews.schemas";

type ReviewQuery = z.infer<typeof reviewQuerySchema>;
type UserReviewQuery = z.infer<typeof userReviewQuerySchema>;
type BookReviewQuery = z.infer<typeof bookReviewsQuerySchema>;
type CreateReviewInput = z.infer<typeof createReviewSchema>;
type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
type TopReviewsQuery = z.infer<typeof topReviewsQuerySchema>;

const buildReviewSort = (
  sort?: string,
  defaultField: keyof Prisma.ReviewOrderByWithRelationInput = "createdAt",
  defaultDirection: Prisma.SortOrder = "desc"
) => {
  if (!sort) {
    return { [defaultField]: defaultDirection } as Prisma.ReviewOrderByWithRelationInput;
  }

  if (sort.startsWith("-")) {
    const field = sort.slice(1) || defaultField;
    return { [field]: "desc" } as Prisma.ReviewOrderByWithRelationInput;
  }

  if (sort.startsWith("+")) {
    const field = sort.slice(1) || defaultField;
    return { [field]: "asc" } as Prisma.ReviewOrderByWithRelationInput;
  }

  if (sort.includes(",")) {
    const [field, direction] = sort.split(",");
    return {
      [field || defaultField]: (direction ?? defaultDirection).toLowerCase() === "desc" ? "desc" : "asc"
    } as Prisma.ReviewOrderByWithRelationInput;
  }

  return { [sort]: defaultDirection } as Prisma.ReviewOrderByWithRelationInput;
};

const reviewInclude = {
  user: { select: { id: true, name: true } },
  book: { select: { id: true, title: true } }
} as const;

const allowedReviewSortFields = ["createdAt", "likeCount", "rating"] as const;

const parseSortField = (
  value: string | undefined,
  fallback: (typeof allowedReviewSortFields)[number]
) =>
  allowedReviewSortFields.includes(value as any)
    ? (value as (typeof allowedReviewSortFields)[number])
    : fallback;

const parseSortOrder = (order?: string) =>
  order?.toLowerCase() === "asc" ? "asc" : "desc";

type PrismaWriteClient = Prisma.TransactionClient | typeof prisma;

const recalcBookRating = async (
  client: PrismaWriteClient,
  bookId: string
) => {
  const aggregates = await client.review.aggregate({
    where: { bookId, deletedAt: null },
    _avg: { rating: true },
    _count: { id: true }
  });
  await client.book.update({
    where: { id: bookId },
    data: {
      reviewCount: aggregates._count.id ?? 0,
      avgRating: new Prisma.Decimal(aggregates._avg.rating ?? 0)
    }
  });
};

export const listReviews = async (query: ReviewQuery) => {
  const { page, size, skip, take, sort } = getPaginationParams(query);
  const where: Prisma.ReviewWhereInput = {
    deletedAt: null,
    ...(query.bookId ? { bookId: query.bookId } : {}),
    ...(query.userId ? { userId: query.userId } : {})
  };

  const orderBy = buildReviewSort(sort);

  const [items, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      skip,
      take,
      orderBy,
      include: reviewInclude
    }),
    prisma.review.count({ where })
  ]);

  return buildPaginationResponse(items, total, page, size, sort);
};

export const getReviewById = async (id: string) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include: reviewInclude
  });
  if (!review) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Review not found", {
      status: StatusCodes.NOT_FOUND
    });
  }
  return review;
};

export const listBookReviews = async (
  bookId: string,
  query: BookReviewQuery
) => {
  const { page, size, skip, take } = getPaginationParams(query);
  const sortField = parseSortField(query.sort, "createdAt");
  const order = parseSortOrder(query.order);

  const where: Prisma.ReviewWhereInput = {
    bookId,
    deletedAt: null
  };

  const orderBy: Prisma.ReviewOrderByWithRelationInput = {
    [sortField]: order
  };

  const [items, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy,
      skip,
      take
    }),
    prisma.review.count({ where })
  ]);

  return buildPaginationResponse(items, total, page, size, sortField);
};

export const createReviewForBook = async (
  bookId: string,
  userId: string,
  input: CreateReviewInput
) => {
  return prisma.$transaction(async (tx) => {
    const book = await tx.book.findFirst({
      where: { id: bookId, deletedAt: null }
    });
    if (!book) {
      throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Book not found", {
        status: StatusCodes.NOT_FOUND
      });
    }

    const existing = await tx.review.findFirst({
      where: { userId, bookId, deletedAt: null }
    });
    if (existing) {
      throw new ApiError(
        ERROR_CODES.DUPLICATE_RESOURCE,
        "Already reviewed this book",
        { status: StatusCodes.CONFLICT }
      );
    }

    const review = await tx.review.create({
      data: {
        bookId,
        userId,
        rating: input.rating,
        title: input.title,
        body: input.body
      },
      include: reviewInclude
    });

    await recalcBookRating(tx, bookId);
    return review;
  });
};

export const moderateReview = async (id: string, hidden: boolean) => {
  await getReviewById(id);
  return prisma.review.update({
    where: { id },
    data: { deletedAt: hidden ? new Date() : null },
    include: reviewInclude
  });
};

export const updateReviewContent = async (
  reviewId: string,
  userId: string,
  input: UpdateReviewInput
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true, bookId: true, deletedAt: true }
  });

  if (!review || review.deletedAt) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Review not found", {
      status: StatusCodes.NOT_FOUND
    });
  }

  if (review.userId !== userId) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Cannot edit this review", {
      status: StatusCodes.FORBIDDEN
    });
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: input.rating ?? undefined,
      title: input.title ?? undefined,
      body: input.body ?? undefined
    },
    include: reviewInclude
  });

  if (typeof input.rating === "number") {
    await recalcBookRating(prisma, review.bookId);
  }

  return updated;
};

export const deleteReview = async (reviewId: string, userId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true, bookId: true, deletedAt: true }
  });

  if (!review || review.deletedAt) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Review not found", {
      status: StatusCodes.NOT_FOUND
    });
  }

  if (review.userId !== userId) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Cannot delete this review", {
      status: StatusCodes.FORBIDDEN
    });
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { deletedAt: new Date() }
  });

  await recalcBookRating(prisma, review.bookId);
};

export const setReviewLike = async (
  reviewId: string,
  userId: string,
  liked: boolean
) => {
  const review = await getReviewById(reviewId);

  const existing = await prisma.reviewLike.findFirst({
    where: { reviewId, userId }
  });

  if (liked) {
    if (existing && !existing.deletedAt) {
      return review;
    }
    if (existing) {
      await prisma.reviewLike.update({
        where: { id: existing.id },
        data: { deletedAt: null }
      });
    } else {
      await prisma.reviewLike.create({
        data: { reviewId, userId }
      });
    }
    await prisma.review.update({
      where: { id: reviewId },
      data: { likeCount: { increment: 1 } }
    });
  } else if (existing && !existing.deletedAt) {
    await prisma.reviewLike.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() }
    });
    await prisma.review.update({
      where: { id: reviewId },
      data: { likeCount: { decrement: 1 } }
    });
  }

  return getReviewById(reviewId);
};

export const listTopReviews = async (query: TopReviewsQuery) => {
  const limitRaw = Math.max(parseInt(query.limit ?? "10", 10), 1);
  const limit = Math.min(limitRaw, 50);
  const sortField =
    query.sort && ["likeCount", "rating"].includes(query.sort)
      ? query.sort
      : "likeCount";
  const order = parseSortOrder(query.order);
  const orderBy: Prisma.ReviewOrderByWithRelationInput = {
    [sortField]: order
  };

  const reviews = await prisma.review.findMany({
    where: {
      deletedAt: null,
      ...(query.bookId ? { bookId: query.bookId } : {})
    },
    orderBy,
    take: limit,
    include: reviewInclude
  });

  return reviews;
};

export const listReviewsByUser = async (
  userId: string,
  query: UserReviewQuery
) => {
  const page = Math.max(parseInt(query.page ?? "1", 10), 1);
  const rawLimit = Math.max(parseInt(query.limit ?? "10", 10), 1);
  const limit = Math.min(rawLimit, 50);
  const skip = (page - 1) * limit;

  const where: Prisma.ReviewWhereInput = {
    userId,
    deletedAt: null,
    ...(query.bookId ? { bookId: query.bookId } : {})
  };

  const [items, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildReviewSort(query.sort),
      include: {
        book: {
          select: {
            id: true,
            title: true
          }
        }
      }
    }),
    prisma.review.count({ where })
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      bookId: item.bookId,
      bookTitle: item.book.title,
      rating: item.rating,
      title: item.title,
      body: item.body,
      likeCount: item.likeCount,
      commentCount: item.commentCount,
      createdAt: item.createdAt.toISOString()
    })),
    page,
    limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit),
    sort: query.sort ?? "-createdAt"
  };
};
