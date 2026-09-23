import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { DocumentService } from "@modules/document";

const documentService = new DocumentService();

export const POST = createHandler<{ id: string }>(
  { workspace: true, requireEntitlement: "hasTrash" },
  async ({ params, user }) => {
    const restored = await documentService.restoreDocument(params.id, user.id);
    return ok(restored);
  }
);
