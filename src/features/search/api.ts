import { api } from "@/store/api";

export interface SearchDocument {
  id: string;
  title: string;
  workspaceId: string;
  workspace: { name: string };
  updatedAt: string;
}

export const searchApi = api.injectEndpoints({
  endpoints: (builder) => ({
    searchDocuments: builder.query<{ documents: SearchDocument[] }, string>({
      query: (q) => ({ url: "/search", params: { q } }),
    }),
  }),
});

export const { useSearchDocumentsQuery } = searchApi;
