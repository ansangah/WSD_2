import { StatusCodes } from "http-status-codes";
import { prisma } from "@core/prisma";
import { ApiError, ERROR_CODES } from "@core/errors";

export const addLibraryEntry = async (
  userId: string,
  bookId: string,
  source?: string
) => {
  const book = await prisma.book.findUnique({
    where: { id: bookId, deletedAt: null }
  });
  if (!book) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Book not found", {
      status: StatusCodes.NOT_FOUND
    });
  }
  const existing = await prisma.userLibrary.findUnique({
    where: { userId_bookId: { userId, bookId } }
  });
  if (existing) {
    throw new ApiError(
      ERROR_CODES.DUPLICATE_RESOURCE,
      "Already added to library",
      { status: StatusCodes.CONFLICT }
    );
  }
  const entry = await prisma.userLibrary.create({
    data: {
      userId,
      bookId,
      source
    },
    include: {
      book: { select: { title: true } }
    }
  });
  return {
    id: entry.id,
    bookId: entry.bookId,
    title: entry.book.title,
    source: entry.source ?? null,
    acquiredAt: entry.acquiredAt.toISOString()
  };
};

export const listLibraryEntries = async (userId: string) => {
  const entries = await prisma.userLibrary.findMany({
    where: { userId },
    orderBy: { acquiredAt: "desc" },
    include: {
      book: { select: { title: true } }
    }
  });
  return entries.map((entry) => ({
    id: entry.id,
    bookId: entry.bookId,
    title: entry.book.title,
    source: entry.source ?? null,
    acquiredAt: entry.acquiredAt.toISOString()
  }));
};

export const removeLibraryEntry = async (userId: string, entryId: string) => {
  const entry = await prisma.userLibrary.findFirst({
    where: { id: entryId, userId }
  });
  if (!entry) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Entry not found", {
      status: StatusCodes.NOT_FOUND
    });
  }
  await prisma.userLibrary.delete({ where: { id: entryId } });
  return { id: entryId };
};
