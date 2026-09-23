import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { DocumentService } from "@modules/document";

const documentService = new DocumentService();

export const GET = createHandler(
  { workspace: true, requireEntitlement: "hasTrash" },
  async ({ workspaceId, user }) => {
    const list = await documentService.listTrashDocuments(workspaceId, user.id);
    return ok(list);
  }
);

export const DELETE = createHandler(
  { workspace: true, requireEntitlement: "hasTrash" },
  async ({ workspaceId, user }) => {
    const result = await documentService.emptyTrash(workspaceId, user.id);
    return ok(result);
  }
);
