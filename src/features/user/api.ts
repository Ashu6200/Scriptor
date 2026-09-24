import { api } from "@/store/api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  platformRole: "USER" | "ADMIN";
  subscriptionPlan: "FREE" | "PRO" | "MAX";
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export const userApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getProfile: builder.query<UserProfile, void>({
      query: () => "/users/profile",
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation<UserProfile, Partial<UserProfile>>({
      query: (body) => ({
        url: "/users/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    changePassword: builder.mutation<
      { success: boolean },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/users/change-password",
        method: "POST",
        body,
      }),
    }),
    getSessions: builder.query<UserSession[], void>({
      query: () => "/users/sessions",
      providesTags: [{ type: "User", id: "SESSIONS" }],
    }),
    revokeSession: builder.mutation<{ revoked: boolean }, { token: string }>({
      query: (body) => ({
        url: "/users/sessions",
        method: "DELETE",
        body,
      }),
      invalidatesTags: [{ type: "User", id: "SESSIONS" }],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
} = userApi;
