export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50];

export function paginateItems<T>(items: T[], state: PaginationState): PaginatedResult<T> {
  const total = items.length;
  const safePageSize = Number.isFinite(state.pageSize) && state.pageSize > 0 ? state.pageSize : DEFAULT_PAGE_SIZE;
  const maxPageIndex = total > 0 ? Math.floor((total - 1) / safePageSize) : 0;
  const pageIndex = Math.min(Math.max(state.pageIndex, 0), maxPageIndex);
  const start = pageIndex * safePageSize;
  return {
    items: items.slice(start, start + safePageSize),
    total,
    pageIndex,
    pageSize: safePageSize,
  };
}
