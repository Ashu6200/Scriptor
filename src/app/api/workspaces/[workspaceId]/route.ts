import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { WorkspaceService, updateWorkspaceSchema } from "@modules/workspace";

const workspaceService = new WorkspaceService();

export const GET = createHandler({ workspace: true }, async ({ workspaceId }) => {
  const workspace = await workspaceService.getWorkspaceById(workspaceId);
  return ok(workspace);
});

export const PUT = createHandler({ workspace: true }, async ({ req, workspaceId }) => {
  const data = updateWorkspaceSchema.parse(await jsonBody(req));
  const workspace = await workspaceService.updateWorkspace(workspaceId, data);
  return ok(workspace);
});

export const DELETE = createHandler({ workspace: true }, async ({ workspaceId, user }) => {
  const result = await workspaceService.deleteWorkspace(workspaceId, user.id);
  return ok(result);
});
