import { api } from "@/store/api";

export interface NotificationPayload {
  documentId?: string;
  title?: string;
  actorId?: string;
  message?: string;
  href?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  type: string;
  payload?: NotificationPayload | null;
  isRead: boolean;
  workspaceId?: string | null;
  createdAt: string;
}

export const notificationApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getNotifications: builder.query<
      { data: Notification[]; meta: { total: number } },
      { page?: number; limit?: number; isRead?: boolean; workspaceId?: string }
    >({
      query: (params) => ({
        url: "/notifications",
        params,
      }),
      providesTags: ["Notification"],
    }),
    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notification"],
    }),
    markRead: builder.mutation<void, string[]>({
      query: (ids) => ({
        url: "/notifications/mark-read",
        method: "POST",
        body: { ids },
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllRead: builder.mutation<void, void>({
      query: () => ({
        url: "/notifications/mark-all-read",
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} = notificationApi;
