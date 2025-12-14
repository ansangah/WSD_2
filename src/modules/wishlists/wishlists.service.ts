import { StatusCodes } from "http-status-codes";
import { prisma } from "@core/prisma";
import { ApiError, ERROR_CODES } from "@core/errors";

export const addToWishlist = async (userId: string, bookId: string) => {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Book not found", {
      status: StatusCodes.NOT_FOUND
    });
  }

  const existing = await prisma.wishlist.findUnique({
    where: { userId_bookId: { userId, bookId } }
  });

  if (existing && !existing.deletedAt) {
    throw new ApiError(ERROR_CODES.DUPLICATE_RESOURCE, "Already wishlisted", {
      status: StatusCodes.CONFLICT
    });
  }

  if (existing && existing.deletedAt) {
    return prisma.wishlist.update({
      where: { id: existing.id },
      data: { deletedAt: null, createdAt: new Date() },
      select: { id: true, bookId: true, createdAt: true }
    });
  }

  return prisma.wishlist.create({
    data: { userId, bookId },
    select: { id: true, bookId: true, createdAt: true }
  });
};

export const listWishlist = async (userId: string) => {
  const items = await prisma.wishlist.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          authors: {
            orderBy: { authorOrder: "asc" },
            select: {
              author: { select: { id: true, name: true } }
            }
          },
          categories: {
            select: {
              category: { select: { id: true, name: true } }
            }
          }
        }
      }
    }
  });

  return items.map((item) => ({
    wishlistId: item.id,
    bookId: item.bookId,
    bookTitle: item.book.title,
    authors: item.book.authors.map((entry) => ({
      id: entry.author.id,
      name: entry.author.name
    })),
    categories: item.book.categories.map((entry) => ({
      id: entry.category.id,
      name: entry.category.name
    })),
    createdAt: item.createdAt.toISOString()
  }));
};

export const removeFromWishlist = async (userId: string, bookId: string) => {
  const existing = await prisma.wishlist.findUnique({
    where: { userId_bookId: { userId, bookId } }
  });

  if (!existing || existing.deletedAt) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Wishlist item not found", {
      status: StatusCodes.NOT_FOUND
    });
  }

  await prisma.wishlist.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() }
  });
};
