import { api } from "@/store/api";

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  documentId: string;
  parentId?: string | null;
  status: "OPEN" | "RESOLVED";
  selectionRange?: { from: number; to: number } | null;
  createdAt: string;
  updatedAt: string;
}

export const commentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query<Comment[], { workspaceId: string; documentId: string }>({
      query: ({ workspaceId, documentId }) =>
        `/workspaces/${workspaceId}/comments/documents/${documentId}/comments`,
      providesTags: (result, error, { documentId }) => [
        { type: "Comment", id: `LIST-${documentId}` },
      ],
    }),
    createComment: builder.mutation<
      Comment,
      {
        workspaceId: string;
        documentId: string;
        content: string;
        parentId?: string;
        selectionRange?: { from: number; to: number };
      }
    >({
      query: ({ workspaceId, documentId, ...body }) => ({
        url: `/workspaces/${workspaceId}/comments/documents/${documentId}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "Comment", id: `LIST-${documentId}` },
      ],
    }),
    updateComment: builder.mutation<Comment, { workspaceId: string; id: string; content: string }>({
      query: ({ workspaceId, id, ...body }) => ({
        url: `/workspaces/${workspaceId}/comments/comments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Comment", id: `LIST-${result.documentId}` }] : [],
    }),
    resolveComment: builder.mutation<
      Comment,
      { workspaceId: string; id: string; status: "OPEN" | "RESOLVED" }
    >({
      query: ({ workspaceId, id, ...body }) => ({
        url: `/workspaces/${workspaceId}/comments/comments/${id}/resolve`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Comment", id: `LIST-${result.documentId}` }] : [],
    }),
    deleteComment: builder.mutation<void, { workspaceId: string; id: string; documentId: string }>({
      query: ({ workspaceId, id }) => ({
        url: `/workspaces/${workspaceId}/comments/comments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "Comment", id: `LIST-${documentId}` },
      ],
    }),
  }),
});

export const {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useResolveCommentMutation,
  useDeleteCommentMutation,
} = commentApi;
