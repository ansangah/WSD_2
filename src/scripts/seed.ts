import "dotenv/config";
import { faker } from "@faker-js/faker";
import { Prisma } from "@core/prisma-client";
import { hashPassword } from "@utils/password";
import { prisma } from "@core/prisma";

const PASSWORD = "P@ssw0rd!";

const createUsers = async () => {
  const adminPassword = await hashPassword(PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: adminPassword,
      name: "Admin User",
      phone: faker.phone.number(),
      role: "ADMIN",
      status: "ACTIVE",
      region: "HQ"
    }
  });

  const curator = await prisma.user.upsert({
    where: { email: "curator@example.com" },
    update: {},
    create: {
      email: "curator@example.com",
      passwordHash: adminPassword,
      name: "Curator Kim",
      phone: faker.phone.number(),
      role: "CURATOR",
      status: "ACTIVE",
      region: "Seoul"
    }
  });

  const customers = [];
  for (let i = 0; i < 30; i += 1) {
    const passwordHash = await hashPassword(PASSWORD);
    customers.push(
      prisma.user.create({
        data: {
          email: `user${i + 1}@example.com`,
          passwordHash,
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          role: "USER",
          status: "ACTIVE",
          region: faker.location.country()
        }
      })
    );
  }

  await Promise.all(customers);
  return [admin, curator];
};

const createCategories = async () => {
  const categories = [];
  for (let i = 0; i < 12; i += 1) {
    const name = `${faker.commerce.department()} ${i}`;
    categories.push(
      prisma.category.create({
        data: {
          name
        }
      })
    );
  }
  return Promise.all(categories);
};

const createAuthors = async () => {
  const authors = [];
  for (let i = 0; i < 40; i += 1) {
    authors.push(
      prisma.author.create({
        data: {
          name: faker.person.fullName(),
          biography: faker.lorem
            .paragraphs({ min: 1, max: 1 })
            .replace(/\s+/g, " ")
            .slice(0, 180)
        }
      })
    );
  }
  return Promise.all(authors);
};

const createBooks = async (categories: string[], authors: string[]) => {
  for (let i = 0; i < 150; i += 1) {
    const title = `${faker.commerce.productName()} Vol.${i}`;
    const selectedCategories = faker.helpers.arrayElements(categories, 2);
    const selectedAuthors = faker.helpers.arrayElements(authors, 2);
    await prisma.book.create({
      data: {
        title,
        isbn13: faker.string.numeric({ length: 13 }),
        description: faker.lorem
          .paragraphs({ min: 1, max: 2 })
          .replace(/\s+/g, " ")
          .slice(0, 180),
        price: new Prisma.Decimal(faker.commerce.price({ min: 5, max: 90 })),
        stock: faker.number.int({ min: 10, max: 200 }),
        languageCode: faker.helpers.arrayElement(["en", "ko", "jp", "fr"]),
        pageCount: faker.number.int({ min: 120, max: 900 }),
        coverUrl: faker.image.url(),
        publishedAt: faker.date.past(),
        categories: {
          create: selectedCategories.map((categoryId) => ({
            category: { connect: { id: categoryId } }
          }))
        },
        authors: {
          create: selectedAuthors.map((authorId, index) => ({
            author: { connect: { id: authorId } },
            authorOrder: index + 1
          }))
        }
      }
    });
  }
};

const createOrders = async () => {
  const users = await prisma.user.findMany({ where: { role: "USER" } });
  const books = await prisma.book.findMany({ take: 80, where: { deletedAt: null } });
  for (let i = 0; i < 70; i += 1) {
    const customer = faker.helpers.arrayElement(users);
    const itemsCount = faker.number.int({ min: 1, max: 4 });
    const orderItems = [];
    let itemTotal = new Prisma.Decimal(0);
    for (let j = 0; j < itemsCount; j += 1) {
      const book = faker.helpers.arrayElement(books);
      const quantity = faker.number.int({ min: 1, max: 3 });
      const subtotal = book.price.mul(quantity);
      itemTotal = itemTotal.add(subtotal);
      orderItems.push({
        bookId: book.id,
        titleSnapshot: book.title,
        quantity,
        unitPrice: book.price,
        subtotal
      });
    }
    const shippingFee = new Prisma.Decimal(faker.number.int({ min: 0, max: 8 }));
    const discountTotal = new Prisma.Decimal(faker.number.int({ min: 0, max: 5 }));
    const totalAmount = itemTotal.minus(discountTotal).add(shippingFee);
    await prisma.order.create({
      data: {
        userId: customer.id,
        status: faker.helpers.arrayElement(["PENDING", "PAID", "FULFILLED"]),
        itemTotal,
        discountTotal,
        shippingFee,
        totalAmount,
        customerNameSnapshot: customer.name,
        customerEmailSnapshot: customer.email,
        items: {
          create: orderItems
        }
      }
    });
  }
};

const createReviews = async () => {
  const users = await prisma.user.findMany({ where: { role: "USER" } });
  const books = await prisma.book.findMany({ take: 60 });
  const reviews = [];
  for (let i = 0; i < 120; i += 1) {
    const user = faker.helpers.arrayElement(users);
    const book = faker.helpers.arrayElement(books);
    const body = faker.lorem
      .sentences({ min: 1, max: 3 })
      .replace(/\s+/g, " ")
      .slice(0, 1000);
    reviews.push(
      prisma.review.create({
        data: {
          userId: user.id,
          bookId: book.id,
          rating: faker.number.int({ min: 3, max: 5 }),
          title: faker.commerce.productAdjective(),
          body
        }
      })
    );
  }
  await Promise.all(reviews);
};

const logCounts = async () => {
  const [users, categories, authors, books, orders, reviews] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.author.count(),
    prisma.book.count(),
    prisma.order.count(),
    prisma.review.count()
  ]);

  console.log("[seed] Row counts", {
    users,
    categories,
    authors,
    books,
    orders,
    reviews
  });
};

const resetDatabase = async () => {
  const steps: Array<[string, () => Promise<unknown>]> = [
    ["reviewLike", () => prisma.reviewLike.deleteMany()],
    ["commentLike", () => prisma.commentLike.deleteMany()],
    ["comment", () => prisma.comment.deleteMany()],
    ["review", () => prisma.review.deleteMany()],
    ["orderItem", () => prisma.orderItem.deleteMany()],
    ["order", () => prisma.order.deleteMany()],
    ["cartItem", () => prisma.cartItem.deleteMany()],
    ["cart", () => prisma.cart.deleteMany()],
    ["bookAuthor", () => prisma.bookAuthor.deleteMany()],
    ["bookCategory", () => prisma.bookCategory.deleteMany()],
    ["book", () => prisma.book.deleteMany()],
    ["author", () => prisma.author.deleteMany()],
    ["category", () => prisma.category.deleteMany()],
    ["userLibrary", () => prisma.userLibrary.deleteMany()],
    ["wishlist", () => prisma.wishlist.deleteMany()],
    ["refreshToken", () => prisma.refreshToken.deleteMany()],
    ["activityLog", () => prisma.activityLog.deleteMany()],
    ["user", () => prisma.user.deleteMany()]
  ];

  for (const [label, action] of steps) {
    try {
      await action();
    } catch (error) {
      console.error(`[seed] Failed to clean ${label}`, error);
      throw error;
    }
  }
};

const main = async () => {
  await resetDatabase();
  await createUsers();
  const categories = await createCategories();
  const authors = await createAuthors();
  await createBooks(
    categories.map((c) => c.id),
    authors.map((a) => a.id)
  );
  await createOrders();
  await createReviews();
  await logCounts();
  console.log("Seed completed");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
