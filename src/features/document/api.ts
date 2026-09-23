import { api } from "@/store/api";

export interface CommentAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Comment {
  id: string;
  content: string;
  status: "OPEN" | "RESOLVED";
  parentId: string | null;
  documentId: string;
  authorId: string;
  author: CommentAuthor;
  resolvedBy?: { id: string; name: string | null } | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  replies: Array<Omit<Comment, "replies">>;
}

export interface DocumentChild {
  id: string;
  title: string;
  updatedAt: string;
  order: number;
}

export interface Document {
  id: string;
  title: string;
  content: string | null;
  workspaceId: string;
  authorId: string;
  parentId?: string | null;
  parent?: { id: string; title: string } | null;
  children?: DocumentChild[];
  visibility: "PUBLIC" | "PRIVATE";
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  title: string;
  content: string;
  versionNumber: number;
  changeSummary?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface DocumentTreeItem {
  id: string;
  title: string;
  parentId?: string | null;
  children: DocumentTreeItem[];
}

export interface TrashDocument {
  id: string;
  title: string;
  slug: string;
  workspaceId: string;
  deletedAt: string;
  author?: { id: string; name: string | null; image: string | null } | null;
  parent?: { id: string; title: string } | null;
  workspace?: { id: string; name: string; slug: string } | null;
}

export interface PublicDocumentData {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  document: Document & {
    author?: { id: string; name: string | null; image: string | null } | null;
    parent?: { id: string; title: string; slug: string } | null;
  };
  publishedDocuments: Array<{
    id: string;
    title: string;
    slug: string;
    parentId?: string | null;
    order: number;
  }>;
}

export const documentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query<
      { data: Document[]; meta: { total: number } },
      { workspaceId?: string; authorId?: string; page?: number; limit?: number; search?: string }
    >({
      query: ({ workspaceId = "all", ...params }) => ({
        url: `/workspaces/${workspaceId}/documents`,
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Document" as const, id })),
              { type: "Document", id: "LIST" },
            ]
          : [{ type: "Document", id: "LIST" }],
    }),
    getDocumentTree: builder.query<DocumentTreeItem[], string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/documents/tree`,
      providesTags: (result, error, workspaceId) => [
        { type: "Document", id: `TREE-${workspaceId}` },
      ],
    }),
    getDocument: builder.query<Document, { workspaceId: string; id: string }>({
      query: ({ workspaceId, id }) => `/workspaces/${workspaceId}/documents/${id}`,
      providesTags: (result, error, { id }) => [{ type: "Document", id }],
    }),
    createDocument: builder.mutation<
      Document,
      { workspaceId: string; title: string; parentId?: string; content?: string }
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/documents`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { workspaceId }) => [
        { type: "Document", id: "LIST" },
        { type: "Document", id: `TREE-${workspaceId}` },
      ],
    }),
    updateDocument: builder.mutation<
      Document,
      {
        workspaceId: string;
        id: string;
        title?: string;
        content?: string;
        changeSummary?: string;
        visibility?: "PRIVATE" | "PUBLIC";
        isPublished?: boolean;
      }
    >({
      query: ({ workspaceId, id, ...body }) => ({
        url: `/workspaces/${workspaceId}/documents/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id, workspaceId }) => [
        { type: "Document", id },
        { type: "Document", id: `TREE-${workspaceId}` },
      ],
    }),
    deleteDocument: builder.mutation<void, { workspaceId: string; id: string }>({
      query: ({ workspaceId, id }) => ({
        url: `/workspaces/${workspaceId}/documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { workspaceId }) => [
        { type: "Document", id: "LIST" },
        { type: "Document", id: "TRASH" },
        { type: "Document", id: `TREE-${workspaceId}` },
      ],
    }),

    getTrashDocuments: builder.query<TrashDocument[], { workspaceId: string }>({
      query: ({ workspaceId }) => `/workspaces/${workspaceId}/documents/trash`,
      providesTags: [{ type: "Document", id: "TRASH" }],
    }),
    restoreDocument: builder.mutation<Document, { workspaceId: string; id: string }>({
      query: ({ workspaceId, id }) => ({
        url: `/workspaces/${workspaceId}/documents/${id}/restore`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { workspaceId, id }) => [
        { type: "Document", id },
        { type: "Document", id: "LIST" },
        { type: "Document", id: "TRASH" },
        { type: "Document", id: `TREE-${workspaceId}` },
      ],
    }),
    permanentlyDeleteDocument: builder.mutation<void, { workspaceId: string; id: string }>({
      query: ({ workspaceId, id }) => ({
        url: `/workspaces/${workspaceId}/documents/${id}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Document", id: "LIST" },
        { type: "Document", id: "TRASH" },
      ],
    }),
    emptyTrash: builder.mutation<{ count: number }, { workspaceId: string }>({
      query: ({ workspaceId }) => ({
        url: `/workspaces/${workspaceId}/documents/trash`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Document", id: "LIST" },
        { type: "Document", id: "TRASH" },
      ],
    }),

    generateAiContent: builder.mutation<
      { result: string; model: string },
      { workspaceId: string; mode: string; prompt?: string; context?: string }
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/ai`,
        method: "POST",
        body,
      }),
    }),

    getPublicDocument: builder.query<
      PublicDocumentData,
      { workspaceSlug: string; documentSlug: string }
    >({
      query: ({ workspaceSlug, documentSlug }) =>
        `/public/documents/${workspaceSlug}/${documentSlug}`,
    }),

    getDocumentVersions: builder.query<DocumentVersion[], { workspaceId: string; id: string }>({
      query: ({ workspaceId, id }) => `/workspaces/${workspaceId}/documents/${id}/versions`,
      providesTags: (result, error, { id }) => [{ type: "Document", id: `VERSIONS-${id}` }],
    }),

    getComments: builder.query<Comment[], { workspaceId: string; documentId: string }>({
      query: ({ workspaceId, documentId }) =>
        `/workspaces/${workspaceId}/comments/documents/${documentId}/comments`,
      providesTags: (result, error, { documentId }) => [
        { type: "Document", id: `COMMENTS-${documentId}` },
      ],
    }),
    createComment: builder.mutation<
      Comment,
      { workspaceId: string; documentId: string; content: string; parentId?: string | null }
    >({
      query: ({ workspaceId, documentId, ...body }) => ({
        url: `/workspaces/${workspaceId}/comments/documents/${documentId}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "Document", id: `COMMENTS-${documentId}` },
      ],
    }),
    updateComment: builder.mutation<
      Comment,
      { workspaceId: string; commentId: string; documentId: string; content: string }
    >({
      query: ({ workspaceId, commentId, content }) => ({
        url: `/workspaces/${workspaceId}/comments/comments/${commentId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "Document", id: `COMMENTS-${documentId}` },
      ],
    }),
    deleteComment: builder.mutation<
      void,
      { workspaceId: string; commentId: string; documentId: string }
    >({
      query: ({ workspaceId, commentId }) => ({
        url: `/workspaces/${workspaceId}/comments/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "Document", id: `COMMENTS-${documentId}` },
      ],
    }),
    resolveComment: builder.mutation<
      Comment,
      { workspaceId: string; commentId: string; documentId: string }
    >({
      query: ({ workspaceId, commentId }) => ({
        url: `/workspaces/${workspaceId}/comments/comments/${commentId}/resolve`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "Document", id: `COMMENTS-${documentId}` },
      ],
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useGetDocumentTreeQuery,
  useGetDocumentQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useGetTrashDocumentsQuery,
  useRestoreDocumentMutation,
  usePermanentlyDeleteDocumentMutation,
  useEmptyTrashMutation,
  useGenerateAiContentMutation,
  useGetPublicDocumentQuery,
  useGetDocumentVersionsQuery,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useResolveCommentMutation,
} = documentApi;

