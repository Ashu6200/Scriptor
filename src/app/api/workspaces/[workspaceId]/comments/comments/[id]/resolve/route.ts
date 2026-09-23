import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { CommentService } from "@modules/comment";

const commentService = new CommentService();

export const POST = createHandler<{ id: string }>({ workspace: true }, async ({ params, user }) =>
  ok(await commentService.resolveComment(params.id, user.id))
);
