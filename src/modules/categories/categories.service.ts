import { StatusCodes } from "http-status-codes";
import { prisma } from "@core/prisma";
import { ApiError, ERROR_CODES } from "@core/errors";
import type {
  createCategorySchema,
  updateCategorySchema
} from "./categories.schemas";
import { z } from "zod";

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createCategory = (input: CreateCategoryInput) =>
  prisma.category.create({
    data: input
  });

export const listCategories = () =>
  prisma.category.findMany({
    include: {
      children: true
    },
    orderBy: { name: "asc" }
  });

export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true
    }
  });
  if (!category) {
    throw new ApiError(ERROR_CODES.RESOURCE_NOT_FOUND, "Category not found", {
      status: StatusCodes.NOT_FOUND
    });
  }
  return category;
};

export const updateCategory = async (
  id: string,
  input: UpdateCategoryInput
) => {
  await getCategoryById(id);
  return prisma.category.update({
    where: { id },
    data: input
  });
};

export const deleteCategory = async (id: string) => {
  await getCategoryById(id);
  await prisma.category.delete({ where: { id } });
};
