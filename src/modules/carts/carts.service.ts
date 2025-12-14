import { StatusCodes } from "http-status-codes";
import { prisma } from "@core/prisma";
import { ApiError, ERROR_CODES } from "@core/errors";

const cartInclude = {
  items: {
    where: { deletedAt: null },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          price: true
        }
      }
    }
  }
} as const;

const formatCart = (cart: any) => {
  const items = cart.items.map((item: any) => {
    const unitPrice = parseFloat(item.unitPrice.toString());
    const subtotal = unitPrice * item.quantity;
    return {
      id: item.id,
      bookId: item.bookId,
      title: item.book.title,
      quantity: item.quantity,
      unitPrice: unitPrice.toFixed(2),
      subtotal: subtotal.toFixed(2)
    };
  });
  const subtotalValue = items.reduce(
    (sum: number, item: any) => sum + parseFloat(item.subtotal),
    0
  );
  const totalQuantity = cart.items.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0
  );
  return {
    cartId: cart.id,
    status: cart.status,
    totalItems: items.length,
    totalQuantity,
    subtotal: subtotalValue.toFixed(2),
    items
  };
};

const getActiveCart = async (userId: string) => {
  const existing = await prisma.cart.findFirst({
    where: { userId, status: "ACTIVE", deletedAt: null },
    include: cartInclude
  });
  if (existing) {
    return existing;
  }
  return prisma.cart.create({
    data: { userId },
    include: cartInclude
  });
};

export const getMyCart = async (userId: string) => {
  const cart = await getActiveCart(userId);
  return formatCart(cart);
};

export const addCartItem = async (
  userId: string,
  bookId: string,
  quantity: number
) => {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book || book.deletedAt) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Book not found", {
      status: StatusCodes.NOT_FOUND
    });
  }
  if (book.stock < quantity) {
    throw new ApiError(ERROR_CODES.STATE_CONFLICT, "Insufficient stock", {
      status: StatusCodes.CONFLICT
    });
  }
  const cart = await getActiveCart(userId);
  const existing = cart.items.find((item: any) => item.bookId === bookId);
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        bookId,
        quantity,
        unitPrice: book.price
      }
    });
  }
  return getMyCart(userId);
};

export const updateCartItemQuantity = async (
  userId: string,
  itemId: string,
  quantity: number
) => {
  const cart = await getActiveCart(userId);
  const item = cart.items.find((i: any) => i.id === itemId);
  if (!item) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Item not found", {
      status: StatusCodes.NOT_FOUND
    });
  }
  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity }
  });
  return getMyCart(userId);
};

export const removeCartItem = async (userId: string, itemId: string) => {
  const cart = await getActiveCart(userId);
  const item = cart.items.find((i: any) => i.id === itemId);
  if (!item) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Item not found", {
      status: StatusCodes.NOT_FOUND
    });
  }
  await prisma.cartItem.update({
    where: { id: itemId },
    data: { deletedAt: new Date() }
  });
  return getMyCart(userId);
};

export const clearCart = async (userId: string) => {
  const cart = await getActiveCart(userId);
  await prisma.cartItem.updateMany({
    where: { cartId: cart.id, deletedAt: null },
    data: { deletedAt: new Date() }
  });
  return getMyCart(userId);
};
