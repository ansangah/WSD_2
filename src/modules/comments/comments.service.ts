import { StatusCodes } from "http-status-codes";
import { prisma } from "@core/prisma";
import { ApiError, ERROR_CODES } from "@core/errors";
import {
  getPaginationParams,
  buildPaginationResponse
} from "@utils/pagination";
import type { z } from "zod";
import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema
} from "./comments.schemas";

type CreateCommentInput = z.infer<typeof createCommentSchema>;
type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
type CommentQuery = z.infer<typeof commentQuerySchema>;

const includeUser = {
  user: {
    select: {
      id: true,
      name: true
    }
  }
} as const;

export const listComments = async (
  reviewId: string,
  query: CommentQuery
) => {
  const { page, size, skip, take, sort } = getPaginationParams(query);
  const orderBy = sort
    ? (() => {
        if (sort.startsWith("-")) {
          return { createdAt: "desc" as const };
        }
        if (sort.startsWith("+")) {
          return { createdAt: "asc" as const };
        }
        const [field, dir] = sort.split(",");
        return { [field || "createdAt"]: (dir ?? "desc").toLowerCase() === "asc" ? "asc" : "desc" };
      })()
    : { createdAt: "desc" as const };

  const [records, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where: { reviewId, deletedAt: null },
      orderBy,
      skip,
      take,
      include: includeUser
    }),
    prisma.comment.count({ where: { reviewId, deletedAt: null } })
  ]);

  const items = records.map((item) => ({
    ...item,
    parentCommentId: item.parentCommentId ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  }));

  return buildPaginationResponse(items, total, page, size, sort);
};

export const createComment = async (
  reviewId: string,
  userId: string,
  input: CreateCommentInput
) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.deletedAt) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Review not found", {
      status: StatusCodes.NOT_FOUND
    });
  }

  if (input.parentCommentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: input.parentCommentId, reviewId, deletedAt: null }
    });
    if (!parent) {
      throw new ApiError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "Parent comment not found",
        { status: StatusCodes.NOT_FOUND }
      );
    }
  }

  const commentRecord = await prisma.comment.create({
    data: {
      reviewId,
      userId,
      body: input.body,
      parentCommentId: input.parentCommentId
    },
    include: includeUser
  });

  await prisma.review.update({
    where: { id: reviewId },
    data: { commentCount: { increment: 1 } }
  });

  return {
    ...commentRecord,
    parentCommentId: commentRecord.parentCommentId ?? null,
    createdAt: commentRecord.createdAt.toISOString(),
    updatedAt: commentRecord.updatedAt.toISOString()
  };
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, reviewId: true, deletedAt: true }
  });

  if (!comment || comment.deletedAt) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Comment not found", {
      status: StatusCodes.NOT_FOUND
    });
  }

  if (comment.userId !== userId) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Cannot delete comment", {
      status: StatusCodes.FORBIDDEN
    });
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() }
  });

  await prisma.review.update({
    where: { id: comment.reviewId },
    data: { commentCount: { decrement: 1 } }
  });

  return { id: commentId };
};

export const updateComment = async (
  commentId: string,
  userId: string,
  input: UpdateCommentInput
) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: includeUser
  });

  if (!comment || comment.deletedAt) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Comment not found", {
      status: StatusCodes.NOT_FOUND
    });
  }

  if (comment.userId !== userId) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Cannot edit comment", {
      status: StatusCodes.FORBIDDEN
    });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { body: input.body },
    include: includeUser
  });

  return {
    ...updated,
    parentCommentId: updated.parentCommentId ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString()
  };
};

export const toggleCommentLike = async (
  commentId: string,
  userId: string,
  like: boolean
) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: includeUser
  });

  if (!comment || comment.deletedAt) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Comment not found", {
      status: StatusCodes.NOT_FOUND
    });
  }

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId } }
  });

  if (like) {
    if (existing && !existing.deletedAt) {
      return comment;
    }
    if (existing) {
      await prisma.commentLike.update({
        where: { id: existing.id },
        data: { deletedAt: null }
      });
    } else {
      await prisma.commentLike.create({
        data: { commentId, userId }
      });
    }
    await prisma.comment.update({
      where: { id: commentId },
      data: { likeCount: { increment: 1 } }
    });
  } else if (existing && !existing.deletedAt) {
    await prisma.commentLike.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() }
    });
    await prisma.comment.update({
      where: { id: commentId },
      data: { likeCount: { decrement: 1 } }
    });
  }

  const updated = await prisma.comment.findUnique({
    where: { id: commentId },
    include: includeUser
  });
  return {
    ...updated!,
    parentCommentId: updated?.parentCommentId ?? null,
    createdAt: updated?.createdAt.toISOString(),
    updatedAt: updated?.updatedAt.toISOString()
  };
};
