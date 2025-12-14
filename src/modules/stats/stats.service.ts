import { prisma } from "@core/prisma";
import { subDays } from "date-fns";
import { Prisma } from "@core/prisma-client";

export const getOverviewStats = async () => {
  const [userCount, bookCount, orderData, reviewCount] = await Promise.all([
    prisma.user.count(),
    prisma.book.count({ where: { deletedAt: null } }),
    prisma.order.aggregate({
      _count: { _all: true },
      _sum: { totalAmount: true }
    }),
    prisma.review.count()
  ]);

  return {
    totalUsers: userCount,
    totalBooks: bookCount,
    totalOrders: orderData._count._all,
    totalRevenue: orderData._sum.totalAmount ?? new Prisma.Decimal(0),
    averageOrderValue:
      orderData._count._all > 0
        ? (orderData._sum.totalAmount ?? new Prisma.Decimal(0)).div(
            orderData._count._all
          )
        : new Prisma.Decimal(0),
    totalReviews: reviewCount
  };
};

export const getTopBooks = async () => {
  const grouped = await prisma.orderItem.groupBy({
    by: ["bookId"],
    _sum: { quantity: true, subtotal: true },
    _count: { _all: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5
  });
  const books = await prisma.book.findMany({
    where: { id: { in: grouped.map((g) => g.bookId) } },
    select: { id: true, title: true }
  });
  const bookMap = new Map(books.map((book) => [book.id, book]));

  return grouped.map((entry) => ({
    book: bookMap.get(entry.bookId),
    quantity: entry._sum.quantity ?? 0,
    revenue: entry._sum.subtotal?.toString() ?? "0",
    orderCount: entry._count._all
  }));
};

export const getDailySales = async () => {
  const startDate = subDays(new Date(), 13);
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate
      }
    },
    select: {
      createdAt: true,
      totalAmount: true
    }
  });

  const aggregates = new Map<string, Prisma.Decimal>();
  orders.forEach((order) => {
    const key = order.createdAt.toISOString().split("T")[0];
    const current = aggregates.get(key) ?? new Prisma.Decimal(0);
    aggregates.set(key, current.add(order.totalAmount));
  });

  return Array.from(aggregates.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({
      date,
      revenue: revenue.toString()
    }));
};
