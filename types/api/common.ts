// /types/api/common.ts
export type ApiErrorResponse = {
  error: string;
};

export type ApiOkResponse<T = unknown> = {
  ok: true;
  data: T;
};

export type ApiResult<T = unknown> = ApiOkResponse<T> | ApiErrorResponse;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
