import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({ baseUrl: "/api" });

export const baseQueryWithEnvelope: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, apiCtx, extraOptions) => {
  const result = await rawBaseQuery(args, apiCtx, extraOptions);

  if (result.data && typeof result.data === "object") {
    const body = result.data as Record<string, unknown>;
    if ("success" in body && "statusCode" in body && "data" in body) {
      return { ...result, data: body.data };
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithEnvelope,
  tagTypes: [
    "User",
    "Workspace",
    "Document",
    "Notification",
    "Comment",
    "Audit",
    "Billing",
    "Admin",
    "Dpdp",
    "Dashboard",
  ],
  endpoints: () => ({}),
});
