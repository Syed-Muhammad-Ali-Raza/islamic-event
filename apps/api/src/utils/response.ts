import { Response } from "express";

interface SuccessOptions<T> {
  res: Response;
  data: T;
  statusCode?: number;
  message?: string;
}

interface PaginatedOptions<T> {
  res: Response;
  data: T[];
  page: number;
  limit: number;
  total: number;
}

// ─── Send a standard success response ────────────────────────────────────────
export function sendSuccess<T>({ res, data, statusCode = 200, message }: SuccessOptions<T>): void {
  res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
  });
}

// ─── Send a paginated response ────────────────────────────────────────────────
export function sendPaginated<T>({ res, data, page, limit, total }: PaginatedOptions<T>): void {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
