import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { WorkspaceService } from "@modules/workspace";
import { z } from "zod";

const workspaceService = new WorkspaceService();

const reorderPinnedSchema = z.object({
  workspaceIds: z.array(z.string()),
});

export const GET = createHandler({ auth: true }, async ({ user }) => {
  const pinnedWorkspaces = await workspaceService.getPinnedWorkspaces(user.id);
  return ok(pinnedWorkspaces);
});

export const PUT = createHandler({ auth: true }, async ({ req, user }) => {
  const { workspaceIds } = reorderPinnedSchema.parse(await jsonBody(req));
  const reordered = await workspaceService.reorderPinnedWorkspaces(workspaceIds, user.id);
  return ok(reordered);
});
