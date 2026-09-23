import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { WorkspaceService } from "@modules/workspace";

const workspaceService = new WorkspaceService();

export const GET = createHandler<{ slug: string }>({ auth: true }, async ({ params }) => {
  const workspace = await workspaceService.getWorkspaceBySlug(params.slug);
  return ok(workspace);
});
