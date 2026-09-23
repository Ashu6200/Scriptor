"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { Button } from "@/components/ui/button";
import {
  type Notification,
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} from "@/features/notification/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Bell, CheckCheck, Inbox } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function getNotificationContent(n: Notification): { message: string; href: string | null } {
  const p = n.payload;

  if (p?.message) {
    return { message: String(p.message), href: p.href ? String(p.href) : null };
  }

  switch (n.type) {
    case "document_created":
      return {
        message: p?.title ? `Document "${p.title}" was created` : "A document was created",
        href: p?.documentId ? `/dashboard/documents/${p.documentId}` : null,
      };
    case "document_updated":
      return {
        message: p?.title ? `Document "${p.title}" was updated` : "A document was updated",
        href: p?.documentId ? `/dashboard/documents/${p.documentId}` : null,
      };
    case "document_deleted":
      return {
        message: p?.title ? `Document "${p.title}" was deleted` : "A document was deleted",
        href: null,
      };
    case "comment_added":
      return {
        message: p?.title ? `New comment on "${p.title}"` : "You received a new comment",
        href: p?.documentId ? `/dashboard/documents/${p.documentId}` : null,
      };
    default:
      return {
        message: n.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        href: p?.href ? String(p.href) : null,
      };
  }
}

export default function NotificationsPage() {
  const { data, isLoading } = useGetNotificationsQuery({});
  const [markRead] = useMarkReadMutation();
  const [markAllRead] = useMarkAllReadMutation();
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 lg:p-6">
        <PageSkeleton variant="page-header" />
        <PageSkeleton variant="table" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 lg:p-6">
      <PageHeader
        title="Notifications"
        description="Stay updated with workspace and document activity."
        actions={
          unreadCount > 0 &&
          (confirmMarkAll ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Mark {unreadCount} as read?</span>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  markAllRead();
                  setConfirmMarkAll(false);
                }}
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Confirm
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmMarkAll(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmMarkAll(true)}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          ))
        }
      />

      <div className="rounded-xl border bg-card overflow-hidden">
        {notifications.map((n) => {
          const { message, href } = getNotificationContent(n);
          const rowClass = cn(
            "flex gap-4 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors",
            !n.isRead && "bg-primary/5 border-l-4 border-l-primary",
            href && "cursor-pointer"
          );
          const inner = (
            <>
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted",
                  !n.isRead && "bg-primary/10 text-primary"
                )}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className={cn("text-sm leading-none", !n.isRead && "font-semibold")}>
                  {message}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              {href && (
                <div className="flex items-center self-center shrink-0 text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              )}
            </>
          );

          if (href) {
            return (
              <Link
                key={n.id}
                href={href}
                className={rowClass}
                onClick={() => !n.isRead && markRead([n.id])}
              >
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={n.id}
              className={cn(rowClass, !n.isRead && "cursor-pointer")}
              onClick={() => !n.isRead && markRead([n.id])}
            >
              {inner}
            </div>
          );
        })}
        {notifications.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="You're all caught up"
            description="New activity from your workspaces will appear here."
          />
        )}
      </div>
    </div>
  );
}
