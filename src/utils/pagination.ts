const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;

export interface PaginationResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort?: string;
}

export interface PaginationQuery {
  page?: string;
  size?: string;
  sort?: string;
}

export const getPaginationParams = (
  query: PaginationQuery
): { page: number; size: number; skip: number; take: number; sort?: string } => {
  const page = Math.max(parseInt(query.page ?? `${DEFAULT_PAGE}`, 10), 1);
  const sizeRaw = Math.max(parseInt(query.size ?? `${DEFAULT_SIZE}`, 10), 1);
  const size = Math.min(sizeRaw, MAX_SIZE);
  const skip = (page - 1) * size;
  const take = size;

  return { page, size, skip, take, sort: query.sort };
};

export const buildPaginationResponse = <T>(
  items: T[],
  total: number,
  page: number,
  size: number,
  sort?: string
): PaginationResult<T> => ({
  content: items,
  page,
  size,
  totalElements: total,
  totalPages: Math.ceil(total / size),
  sort
});
