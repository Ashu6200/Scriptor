"use client";

import { Button } from "@/components/ui/button";
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useGetCommentsQuery,
  useResolveCommentMutation,
  type Comment,
} from "@/features/document/api";
import { formatDistanceToNow } from "date-fns";
import { Check, MessageSquare, Reply, Trash2, X } from "lucide-react";
import { useState } from "react";

interface CommentsPanelProps {
  workspaceId: string;
  documentId: string;
  currentUserId?: string;
}

function CommentItem({
  comment,
  workspaceId,
  documentId,
  currentUserId,
  isReply = false,
}: {
  comment: Comment | Omit<Comment, "replies">;
  workspaceId: string;
  documentId: string;
  currentUserId?: string;
  isReply?: boolean;
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [resolveComment] = useResolveCommentMutation();

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await createComment({
      workspaceId,
      documentId,
      content: replyText.trim(),
      parentId: comment.id,
    });
    setReplyText("");
    setShowReplyInput(false);
  };

  const isResolved = comment.status === "RESOLVED";

  return (
    <div className={`${isReply ? "ml-6 border-l-2 border-border pl-3" : ""}`}>
      <div
        className={`rounded-lg border p-3 space-y-2 ${
          isResolved ? "border-border/40 bg-muted/20 opacity-60" : "border-border bg-card"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
              {(comment.author.name ?? comment.author.id).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground truncate">
                {comment.author.name ?? "Unknown"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          {isResolved && (
            <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
              Resolved
            </span>
          )}
        </div>

        <p
          className={`text-xs leading-relaxed ${
            isResolved ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          {comment.content}
        </p>

        {!isReply && (
          <div className="flex items-center gap-1 pt-1">
            {!isResolved && (
              <>
                <button
                  onClick={() => setShowReplyInput((p) => !p)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
                <span className="text-border">·</span>
                <button
                  onClick={() => resolveComment({ workspaceId, commentId: comment.id, documentId })}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-emerald-600 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Resolve
                </button>
              </>
            )}
            {comment.authorId === currentUserId && (
              <>
                {!isResolved && <span className="text-border">·</span>}
                <button
                  onClick={() => deleteComment({ workspaceId, commentId: comment.id, documentId })}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showReplyInput && (
        <div className="mt-2 ml-6 space-y-1.5">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 text-[10px] px-3"
              onClick={handleReply}
              disabled={isCreating || !replyText.trim()}
            >
              Reply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] px-3"
              onClick={() => {
                setShowReplyInput(false);
                setReplyText("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {"replies" in comment &&
        comment.replies?.map((reply) => (
          <div key={reply.id} className="mt-2">
            <CommentItem
              comment={reply}
              workspaceId={workspaceId}
              documentId={documentId}
              currentUserId={currentUserId}
              isReply
            />
          </div>
        ))}
    </div>
  );
}

export function CommentsPanel({ workspaceId, documentId, currentUserId }: CommentsPanelProps) {
  const { data: comments = [], isLoading } = useGetCommentsQuery(
    { workspaceId, documentId },
    { skip: !workspaceId || workspaceId === "all" }
  );
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [newComment, setNewComment] = useState("");

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    await createComment({ workspaceId, documentId, content: newComment.trim() });
    setNewComment("");
  };

  const openCount = comments.filter((c) => c.status === "OPEN").length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Comments</h3>
        {openCount > 0 && (
          <span className="ml-auto text-[10px] font-mono font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            {openCount} open
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No comments yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Be the first to leave a comment
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              workspaceId={workspaceId}
              documentId={documentId}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-border shrink-0 space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
          placeholder="Add a comment… (Ctrl+Enter to submit)"
          rows={3}
          className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleSubmit}
          disabled={isCreating || !newComment.trim()}
        >
          {isCreating ? "Posting…" : "Post Comment"}
        </Button>
      </div>
    </div>
  );
}
