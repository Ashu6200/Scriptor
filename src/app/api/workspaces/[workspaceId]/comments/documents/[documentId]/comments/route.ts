import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { CommentService, createCommentSchema } from "@modules/comment";

const commentService = new CommentService();

export const GET = createHandler<{ documentId: string }>({ workspace: true }, async ({ params }) =>
  ok(await commentService.getDocumentComments(params.documentId))
);

export const POST = createHandler<{ documentId: string }>(
  { workspace: true },
  async ({ req, params, user }) => {
    const data = createCommentSchema.parse(await jsonBody(req));
    const comment = await commentService.createComment(params.documentId, data, user.id);
    return ok(comment, 201);
  }
);
