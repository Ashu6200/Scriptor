import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { WorkspaceService } from "@modules/workspace";

const workspaceService = new WorkspaceService();

export const POST = createHandler({ workspace: true }, async ({ params, user }) => {
  const result = await workspaceService.togglePinWorkspace(params.workspaceId, user.id);
  return ok(result);
});

export const DELETE = createHandler({ workspace: true }, async ({ params, user }) => {
  const result = await workspaceService.unpinWorkspace(params.workspaceId, user.id);
  return ok(result);
});
