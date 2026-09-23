import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { DocumentService } from "@modules/document";

const documentService = new DocumentService();

export const GET = createHandler<{ workspaceSlug: string; documentSlug: string }>(
  {
    auth: false,
    rateLimit: { limit: 120, windowSeconds: 60 },
  },
  async ({ params }) => {
    const result = await documentService.getPublicDocument(
      params.workspaceSlug,
      params.documentSlug
    );
    return ok(result);
  }
);
