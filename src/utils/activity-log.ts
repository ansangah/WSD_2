import { Prisma } from "@core/prisma-client";
import { prisma } from "@core/prisma";

export const recordActivity = async (
  userId: string | null,
  action: string,
  metadata?: Record<string, unknown>
) => {
  await prisma.activityLog.create({
    data: {
      userId: userId ?? undefined,
      action,
      metadata: metadata as Prisma.InputJsonValue
    }
  });
};
