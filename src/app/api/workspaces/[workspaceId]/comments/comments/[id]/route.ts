import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { CommentService, updateCommentSchema } from "@modules/comment";

const commentService = new CommentService();

export const PUT = createHandler<{ id: string }>(
  { workspace: true },
  async ({ req, params, user }) => {
    const data = updateCommentSchema.parse(await jsonBody(req));
    return ok(await commentService.updateComment(params.id, data, user.id));
  }
);

export const DELETE = createHandler<{ id: string }>({ workspace: true }, async ({ params }) =>
  ok(await commentService.deleteComment(params.id))
);
