import { StatusCodes } from "http-status-codes";
import { prisma } from "@core/prisma";
import { ApiError, ERROR_CODES } from "@core/errors";
import {
  getPaginationParams,
  buildPaginationResponse
} from "@utils/pagination";
import { hashPassword } from "@utils/password";
import { Prisma, UserRole, UserStatus } from "@core/prisma-client";
import type {
  CreateUserInput,
  UpdateUserInput,
  ProfileUpdateInput
} from "./users.schemas";

export const createUser = async (input: CreateUserInput) => {
  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      phone: input.phone,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      gender: input.gender,
      region: input.region
    },
    select: baseSelect
  });
};

const baseSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  birthDate: true,
  gender: true,
  region: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Record<string, true>;

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

export const findUserById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: baseSelect });

  if (!user) {
    throw new ApiError(ERROR_CODES.USER_NOT_FOUND, "User not found", {
      status: StatusCodes.NOT_FOUND
    });
  }

  return user;
};

export const listUsers = async (query: Record<string, string | undefined>) => {
  const { page, size, skip, take, sort } = getPaginationParams(query);
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role as UserRole } : {}),
    ...(query.status ? { status: query.status as UserStatus } : {}),
    ...(query.keyword
      ? {
          OR: [
            { email: { contains: query.keyword } },
            { name: { contains: query.keyword } },
            { region: { contains: query.keyword } }
          ]
        }
      : {})
  };

  const orderBy = sort
    ? (() => {
        const [field, direction] = sort.split(",");
        return { [field]: (direction ?? "asc").toLowerCase() === "desc" ? "desc" : "asc" };
      })()
    : { createdAt: "desc" as const };

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: baseSelect,
      skip,
      take,
      orderBy
    }),
    prisma.user.count({ where })
  ]);

  return buildPaginationResponse(items, total, page, size, sort);
};

const toUpdateData = (
  input: UpdateUserInput | ProfileUpdateInput
): Prisma.UserUpdateInput => ({
  ...input,
  birthDate: input.birthDate ? new Date(input.birthDate) : undefined
});

export const updateUser = async (id: string, input: UpdateUserInput) => {
  await findUserById(id);
  return prisma.user.update({
    where: { id },
    data: toUpdateData(input),
    select: baseSelect
  });
};

export const updateProfile = async (
  id: string,
  input: ProfileUpdateInput
) => {
  return prisma.user.update({
    where: { id },
    data: toUpdateData(input),
    select: baseSelect
  });
};

export const deleteUser = async (id: string) => {
  await findUserById(id);
  await prisma.user.update({
    where: { id },
    data: { status: UserStatus.INACTIVE }
  });
};

export const changeUserRole = async (id: string, role: UserRole) => {
  await findUserById(id);
  return prisma.user.update({
    where: { id },
    data: { role },
    select: baseSelect
  });
};

export const deactivateUser = async (id: string, status: UserStatus) => {
  await findUserById(id);
  return prisma.user.update({
    where: { id },
    data: { status },
    select: baseSelect
  });
};

export const getUserOrders = async (userId: string) => {
  await findUserById(userId);
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          book: {
            select: { id: true, title: true, price: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};

export const getUserReviews = async (userId: string) => {
  await findUserById(userId);
  return prisma.review.findMany({
    where: { userId },
    include: {
      book: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: "desc" }
  });
};

export const getUserWithPassword = (id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      passwordHash: true
    }
  });

export const softDeleteUser = (id: string) =>
  prisma.user.update({
    where: { id },
    data: {
      status: UserStatus.INACTIVE,
      deletedAt: new Date()
    },
    select: {
      id: true,
      deletedAt: true
    }
  });

const parseSortDirection = (order?: string) =>
  order?.toLowerCase() === "asc" ? "asc" : "desc";

export const listUserLikes = async (
  userId: string,
  query: Record<string, string | undefined>
) => {
  const { page, size, skip, take } = getPaginationParams({
    page: query.page,
    size: query.size
  });
  const order = parseSortDirection(query.order);
  const type = query.type === "comment" ? "comment" : "review";

  if (type === "comment") {
    const [items, total] = await prisma.$transaction([
      prisma.commentLike.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: order },
        skip,
        take,
        include: {
          comment: {
            select: {
              id: true,
              reviewId: true,
              review: {
                select: {
                  id: true,
                  title: true,
                  bookId: true,
                  book: { select: { title: true } }
                }
              }
            }
          }
        }
      }),
      prisma.commentLike.count({
        where: { userId, deletedAt: null }
      })
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        type: "comment" as const,
        reviewId: item.comment.reviewId,
        commentId: item.comment.id,
        bookId: item.comment.review?.bookId ?? null,
        bookTitle: item.comment.review?.book.title ?? null,
        rating: null,
        reviewTitle: item.comment.review?.title ?? null,
        likedAt: item.createdAt.toISOString()
      })),
      page,
      size,
      totalItems: total,
      totalPages: Math.ceil(total / size),
      sort: "createdAt",
      order,
      type
    };
  }

  const [likes, total] = await prisma.$transaction([
    prisma.reviewLike.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: order },
      skip,
      take,
      include: {
        review: {
          select: {
            id: true,
            rating: true,
            title: true,
            bookId: true,
            book: { select: { title: true } }
          }
        }
      }
    }),
    prisma.reviewLike.count({
      where: { userId, deletedAt: null }
    })
  ]);

  return {
    items: likes.map((item) => ({
      id: item.id,
      type: "review" as const,
      reviewId: item.reviewId,
      commentId: null,
      bookId: item.review?.bookId ?? null,
      bookTitle: item.review?.book.title ?? null,
      rating: item.review?.rating ?? null,
      reviewTitle: item.review?.title ?? null,
      likedAt: item.createdAt.toISOString()
    })),
    page,
    size,
    totalItems: total,
    totalPages: Math.ceil(total / size),
    sort: "createdAt",
    order,
    type
  };
};
