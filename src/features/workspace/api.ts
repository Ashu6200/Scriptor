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
      providesTags: ["Workspace"],
    }),
    getPinnedWorkspaces: builder.query<Workspace[], void>({
      query: () => "/workspaces/pinned",
      providesTags: ["Workspace"],
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
      invalidatesTags: ["Workspace"],
    }),
    updateWorkspace: builder.mutation<Workspace, { id: string; data: Partial<Workspace> }>({
      query: ({ id, data }) => ({
        url: `/workspaces/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Workspace", id }, "Workspace"],
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
        const patchResult = dispatch(
          workspaceApi.util.updateQueryData("getWorkspaces", undefined, (draft) => {
            const ws = draft.find((w) => w.id === workspaceId);
            if (ws) {
              ws.isPinned = !ws.isPinned;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Workspace"],
    }),
    reorderPinnedWorkspacesApi: builder.mutation<Workspace[], string[]>({
      query: (workspaceIds) => ({
        url: "/workspaces/pinned",
        method: "PUT",
        body: { workspaceIds },
      }),
      invalidatesTags: ["Workspace"],
    }),
    deleteWorkspace: builder.mutation<void, string>({
      query: (id) => ({
        url: `/workspaces/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Workspace"],
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
