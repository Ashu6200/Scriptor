"use client";

import {
  useDeactivateUserMutation,
  useGetAdminUsersQuery,
  useOverridePlanMutation,
  useReactivateUserMutation,
  useToggleUserRoleMutation,
} from "@/features/admin/api";
import { Input } from "@/components/ui/input";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const PLAN_COLORS: Record<string, string> = {
  FREE: "bg-muted text-muted-foreground border border-border",
  PRO: "bg-primary/10 text-primary ring-1 ring-primary/20",
  MAX: "bg-purple-500/10 text-purple-500 dark:text-purple-400 ring-1 ring-purple-500/20",
};

type UserFilterValues = { search: string; role: string; status: string };

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);

  const form = useForm<UserFilterValues>({
    defaultValues: { search: "", role: "", status: "" },
  });
  const { search, role, status } = form.watch();

  useEffect(() => {
    setPage(1);
  }, [search, role, status]);

  const { data, isLoading } = useGetAdminUsersQuery({
    page,
    limit: 20,
    search: search || undefined,
    role: role || undefined,
    status: status || undefined,
  });
  const [toggleRole] = useToggleUserRoleMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [reactivateUser] = useReactivateUserMutation();
  const [overridePlan] = useOverridePlanMutation();

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">User Directory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search, filter, and manage all platform users
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-70">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by email or name..."
            className="pl-10 pr-4 h-10 bg-card"
            {...form.register("search")}
          />
        </div>
        <select
          {...form.register("role")}
          className="px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          {...form.register("status")}
          className="px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {isLoading ? (
        <PageSkeleton variant="table" />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Workspaces
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-foreground font-semibold">{user.name || "—"}</p>
                            <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.platformRole === "ADMIN"
                              ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {user.platformRole === "ADMIN" && <Shield className="h-3 w-3" />}
                          {user.platformRole}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={user.subscriptionPlan}
                          onChange={(e) =>
                            overridePlan({
                              userId: user.id,
                              plan: e.target.value,
                            })
                          }
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold border-0 focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer ${
                            PLAN_COLORS[user.subscriptionPlan] || PLAN_COLORS.FREE
                          }`}
                          style={{ background: "transparent" }}
                        >
                          <option value="FREE" className="bg-card text-foreground">
                            Free
                          </option>
                          <option value="PRO" className="bg-card text-foreground">
                            Pro
                          </option>
                          <option value="MAX" className="bg-card text-foreground">
                            Max
                          </option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.deletedAt
                              ? "bg-rose-500/10 text-rose-500 dark:text-rose-400"
                              : "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.deletedAt ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                          />
                          {user.deletedAt ? "Deactivated" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-muted-foreground">
                          {user._count.ownedWorkspaces}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs font-mono">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              toggleRole({
                                userId: user.id,
                                role: user.platformRole === "ADMIN" ? "USER" : "ADMIN",
                              })
                            }
                            title={
                              user.platformRole === "ADMIN" ? "Demote to User" : "Promote to Admin"
                            }
                            className="p-1.5 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                          >
                            {user.platformRole === "ADMIN" ? (
                              <ShieldOff className="h-4 w-4" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </button>
                          {user.deletedAt ? (
                            <button
                              onClick={() => reactivateUser(user.id)}
                              title="Reactivate User"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => deactivateUser(user.id)}
                              title="Deactivate User"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {meta.page} of {meta.totalPages} · {meta.total} users
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!meta.hasMore}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
