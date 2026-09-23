import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok, paginated } from "@/server/http/responses";
import { DocumentService, createDocumentSchema, listDocumentsQuerySchema } from "@modules/document";

const documentService = new DocumentService();

export const GET = createHandler({ workspace: true }, async ({ workspaceId, query, user }) => {
  const parsed = listDocumentsQuerySchema.parse(query);
  const result = await documentService.listDocuments(workspaceId, parsed, user.id);
  return paginated(result!);
});

export const POST = createHandler(
  {
    workspace: true,
    rateLimit: { limit: 30, windowSeconds: 60 },
  },
  async ({ req, workspaceId, user }) => {
    const data = createDocumentSchema.parse({
      ...((await jsonBody(req)) as object),
      workspaceId,
    });
    const document = await documentService.createDocument(data, user.id);
    return ok(document, 201);
  }
);
