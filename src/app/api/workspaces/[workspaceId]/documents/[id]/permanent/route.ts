import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { DocumentService } from "@modules/document";

const documentService = new DocumentService();

export const DELETE = createHandler<{ id: string }>(
  { workspace: true, requireEntitlement: "hasTrash" },
  async ({ params, user }) => {
    const result = await documentService.permanentlyDeleteDocument(params.id, user.id);
    return ok(result);
  }
);
