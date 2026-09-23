import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { DocumentService, updateDocumentSchema } from "@modules/document";

const documentService = new DocumentService();

export const GET = createHandler<{ id: string }>(
  { workspace: true },
  async ({ params, workspaceId }) =>
    ok(await documentService.getDocumentById(params.id, workspaceId))
);

export const PUT = createHandler<{ id: string }>(
  { workspace: true },
  async ({ req, params, user }) => {
    const data = updateDocumentSchema.parse(await jsonBody(req));
    return ok(await documentService.updateDocument(params.id, data, user.id));
  }
);

export const DELETE = createHandler<{ id: string }>({ workspace: true }, async ({ params, user }) =>
  ok(await documentService.deleteDocument(params.id, user.id))
);
