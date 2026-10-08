import { api } from "@/store/api";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  type: "PERSONAL";
  logoUrl?: string | null;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const workspaceApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getWorkspaces: builder.query<Workspace[], void>({
      query: () => "/workspaces",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Workspace" as const, id })),
              { type: "Workspace", id: "LIST" },
            ]
          : [{ type: "Workspace", id: "LIST" }],
    }),
    getPinnedWorkspaces: builder.query<Workspace[], void>({
      query: () => "/workspaces/pinned",
      providesTags: [{ type: "Workspace", id: "PINNED" }],
    }),
    getWorkspaceById: builder.query<Workspace, string>({
      query: (id) => `/workspaces/${id}`,
      providesTags: (result, error, id) => [{ type: "Workspace", id }],
    }),
    getWorkspaceBySlug: builder.query<Workspace, string>({
      query: (slug) => `/workspaces/slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Workspace", id: `SLUG-${slug}` }],
    }),
    createWorkspace: builder.mutation<Workspace, Partial<Workspace>>({
      query: (body) => ({
        url: "/workspaces",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Workspace", id: "LIST" },
        { type: "Dashboard", id: "STATS" },
      ],
    }),
    updateWorkspace: builder.mutation<Workspace, { id: string; data: Partial<Workspace> }>({
      query: ({ id, data }) => ({
        url: `/workspaces/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Workspace", id },
        { type: "Workspace", id: "LIST" },
        { type: "Workspace", id: "PINNED" },
      ],
    }),
    togglePinWorkspaceApi: builder.mutation<
      { workspaceId: string; isPinned: boolean; pinnedWorkspaceIds: string[] },
      string
    >({
      query: (workspaceId) => ({
        url: `/workspaces/${workspaceId}/pin`,
        method: "POST",
      }),
      async onQueryStarted(workspaceId, { dispatch, queryFulfilled }) {
        const patchWorkspaces = dispatch(
          workspaceApi.util.updateQueryData("getWorkspaces", undefined, (draft) => {
            const ws = draft.find((w) => w.id === workspaceId);
            if (ws) {
              ws.isPinned = !ws.isPinned;
            }
          })
        );
        const patchPinned = dispatch(
          workspaceApi.util.updateQueryData("getPinnedWorkspaces", undefined, (draft) => {
            const idx = draft.findIndex((w) => w.id === workspaceId);
            if (idx !== -1) {
              draft.splice(idx, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchWorkspaces.undo();
          patchPinned.undo();
        }
      },
      invalidatesTags: (result) => (result?.isPinned ? [{ type: "Workspace", id: "PINNED" }] : []),
    }),
    reorderPinnedWorkspacesApi: builder.mutation<Workspace[], string[]>({
      query: (workspaceIds) => ({
        url: "/workspaces/pinned",
        method: "PUT",
        body: { workspaceIds },
      }),
      invalidatesTags: [{ type: "Workspace", id: "PINNED" }],
    }),
    deleteWorkspace: builder.mutation<void, string>({
      query: (id) => ({
        url: `/workspaces/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Workspace", id: "LIST" },
        { type: "Workspace", id: "PINNED" },
        { type: "Dashboard", id: "STATS" },
      ],
    }),
  }),
});

export const {
  useGetWorkspacesQuery,
  useGetPinnedWorkspacesQuery,
  useGetWorkspaceByIdQuery,
  useGetWorkspaceBySlugQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useTogglePinWorkspaceApiMutation,
  useReorderPinnedWorkspacesApiMutation,
  useDeleteWorkspaceMutation,
} = workspaceApi;
