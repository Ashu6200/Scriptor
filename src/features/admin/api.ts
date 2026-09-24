import { api } from "@/store/api";

export interface DayDataPoint {
  date: string;
  value: number;
}

export interface AdminAnalytics {
  revenueSeries: DayDataPoint[];
  signupSeries: DayDataPoint[];
  totalRevenueINR: number;
  totalSignups: number;
  totalTransactions: number;
  subscriptionStatus: Record<string, number>;
  paymentMethods: { method: string | null; count: number; amountINR: number }[];
}

export interface AdminTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  capturedAt: string | null;
  createdAt: string;
  razorpayPaymentId: string | null;
  failureReason: string | null;
  user: { id: string; email: string; name: string | null };
  order: { id: string; orderNumber: string };
}

export interface AdminMetrics {
  totalUsers: number;
  totalWorkspaces: number;
  totalDocuments: number;
  activeUsers7d: number;
  newUsers7d: number;
  mrr: number;
  planCounts: Record<string, number>;
  failedPayments: number;
  paymentStats?: {
    totalCapturedCount: number;
    totalCapturedPaise: number;
    totalRefundedCount: number;
    totalRefundedPaise: number;
    netRevenuePaise: number;
    netRevenueINR: number;
    failedPaymentsCount: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  platformRole: "USER" | "ADMIN";
  subscriptionPlan: "FREE" | "PRO" | "MAX";
  subscriptionStatus: string | null;
  emailVerified: boolean;
  deletedAt: string | null;
  createdAt: string;
  _count: { ownedWorkspaces: number };
}

export interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  type: string;
  suspendedAt: string | null;
  createdAt: string;
  owner: { id: string; name: string | null; email: string; subscriptionPlan: string };
  _count: { documents: number };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const adminApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAdminMetrics: builder.query<AdminMetrics, void>({
      query: () => "/admin/metrics",
      providesTags: [{ type: "Admin", id: "METRICS" }],
    }),

    getAdminUsers: builder.query<
      PaginatedResponse<AdminUser>,
      { page?: number; limit?: number; search?: string; role?: string; status?: string }
    >({
      query: (params) => ({
        url: "/admin/users",
        params,
      }),
      providesTags: [{ type: "Admin", id: "USERS" }],
    }),
    toggleUserRole: builder.mutation<AdminUser, { userId: string; role: "USER" | "ADMIN" }>({
      query: ({ userId, role }) => ({
        url: `/admin/users/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: [{ type: "Admin", id: "USERS" }],
    }),
    deactivateUser: builder.mutation<{ id: string; deactivated: boolean }, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Admin", id: "USERS" },
        { type: "Admin", id: "METRICS" },
      ],
    }),
    reactivateUser: builder.mutation<{ id: string; reactivated: boolean }, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/reactivate`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Admin", id: "USERS" },
        { type: "Admin", id: "METRICS" },
      ],
    }),

    getAdminWorkspaces: builder.query<
      PaginatedResponse<AdminWorkspace>,
      { page?: number; limit?: number; search?: string; plan?: string }
    >({
      query: (params) => ({
        url: "/admin/workspaces",
        params,
      }),
      providesTags: [{ type: "Admin", id: "WORKSPACES" }],
    }),
    overridePlan: builder.mutation<AdminUser, { userId: string; plan: string }>({
      query: ({ userId, plan }) => ({
        url: `/admin/users/${userId}/plan`,
        method: "PATCH",
        body: { plan },
      }),
      invalidatesTags: [
        { type: "Admin", id: "USERS" },
        { type: "Admin", id: "WORKSPACES" },
        { type: "Admin", id: "METRICS" },
      ],
    }),
    suspendWorkspace: builder.mutation<AdminWorkspace, string>({
      query: (workspaceId) => ({
        url: `/admin/workspaces/${workspaceId}/suspend`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Admin", id: "WORKSPACES" }],
    }),
    unsuspendWorkspace: builder.mutation<AdminWorkspace, string>({
      query: (workspaceId) => ({
        url: `/admin/workspaces/${workspaceId}/suspend`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Admin", id: "WORKSPACES" }],
    }),

    getPlatformSettings: builder.query<Record<string, string>, void>({
      query: () => "/admin/settings",
      providesTags: [{ type: "Admin", id: "SETTINGS" }],
    }),
    updatePlatformSetting: builder.mutation<
      { key: string; value: string },
      { key: string; value: string }
    >({
      query: (body) => ({
        url: "/admin/settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Admin", id: "SETTINGS" }],
    }),

    getAdminAnalytics: builder.query<AdminAnalytics, { from: string; to: string }>({
      query: (params) => ({ url: "/admin/analytics", params }),
      providesTags: [{ type: "Admin", id: "ANALYTICS" }],
    }),

    getAdminTransactions: builder.query<
      PaginatedResponse<AdminTransaction>,
      { page?: number; limit?: number; status?: string; from?: string; to?: string }
    >({
      query: (params) => ({ url: "/admin/transactions", params }),
      providesTags: [{ type: "Admin", id: "TRANSACTIONS" }],
    }),
  }),
});

export const {
  useGetAdminMetricsQuery,
  useGetAdminUsersQuery,
  useToggleUserRoleMutation,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useGetAdminWorkspacesQuery,
  useOverridePlanMutation,
  useSuspendWorkspaceMutation,
  useUnsuspendWorkspaceMutation,
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingMutation,
  useGetAdminAnalyticsQuery,
  useGetAdminTransactionsQuery,
} = adminApi;
