import { api } from "@/store/api";

export interface DashboardStats {
  totalDocs: number;
  totalWorkspaces: number;
  subscriptionPlan: "FREE" | "PRO" | "MAX";
  platformRole: "USER" | "ADMIN";
}

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => "/dashboard/stats",
      providesTags: ["Dashboard", "Workspace", "Document", "User"],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
