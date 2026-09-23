import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { DocumentService } from "@modules/document";

const documentService = new DocumentService();

export const GET = createHandler<{ id: string }>({ workspace: true }, async ({ params, user }) =>
  ok(await documentService.getVersionHistory(params.id, user))
);
