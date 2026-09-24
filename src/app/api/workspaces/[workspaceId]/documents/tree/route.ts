import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { DocumentService } from "@modules/document";

const documentService = new DocumentService();

export const GET = createHandler({ workspace: true }, async ({ workspaceId, user, query }) => {
  const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;
  return ok(await documentService.getDocumentTree(workspaceId, user.id, limit));
});
