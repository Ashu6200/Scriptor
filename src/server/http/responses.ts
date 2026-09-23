import "server-only";
import { NextResponse } from "next/server";

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export function ok<T>(
  data: T,
  statusCodeOrMessage: number | string = 200,
  statusCode = 200
): NextResponse<ApiEnvelope<T>> {
  const isNumber = typeof statusCodeOrMessage === "number";
  const finalStatus = isNumber ? statusCodeOrMessage : statusCode;
  const finalMessage = isNumber ? "Success" : statusCodeOrMessage;

  return NextResponse.json(
    { success: true, statusCode: finalStatus, message: finalMessage, data },
    { status: finalStatus }
  );
}

export function paginated<T>(
  result: PaginatedResult<T>,
  message = "Success",
  statusCode = 200
): NextResponse<ApiEnvelope<{ data: T[]; meta: Omit<PaginatedResult<T>, "data"> }>> {
  const { data, ...meta } = result;

  return NextResponse.json(
    { success: true, statusCode, message, data: { data, meta } },
    { status: statusCode }
  );
}
