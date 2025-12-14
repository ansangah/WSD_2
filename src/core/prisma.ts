import { PrismaClient } from "@core/prisma-client";
import { env } from "@config/env";
import { logger } from "@core/logger";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: env.DATABASE_URL
});

const adapter = new PrismaPg(pool);
let shuttingDown = false;

export const prisma = new PrismaClient({
  adapter,
  log:
    env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  errorFormat: "pretty"
});

const shutdown = async () => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  await prisma.$disconnect();
  await pool.end();
  logger.info("Prisma client disconnected");
};

process.on("beforeExit", shutdown);
