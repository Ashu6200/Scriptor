"use client";

import { Input } from "@/components/ui/input";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { useGetAdminTransactionsQuery } from "@/features/admin/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const STATUS_OPTIONS = ["CAPTURED", "FAILED", "REFUNDED", "CANCELLED", "CREATED", "AUTHORIZED"];

const STATUS_BADGE: Record<string, string> = {
  CAPTURED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  FAILED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  REFUNDED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  CANCELLED: "bg-muted/50 text-muted-foreground border-border",
  CREATED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  AUTHORIZED: "bg-violet-500/10 text-violet-500 border-violet-500/20",
};

type FilterValues = { status: string; fromDate: string; toDate: string };

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);

  const form = useForm<FilterValues>({
    defaultValues: { status: "", fromDate: "", toDate: "" },
  });
  const { status, fromDate, toDate } = form.watch();

  useEffect(() => {
    setPage(1);
  }, [status, fromDate, toDate]);

  const params = {
    page,
    limit: 20,
    ...(status && { status }),
    ...(fromDate && { from: new Date(fromDate).toISOString() }),
    ...(toDate && { to: new Date(`${toDate}T23:59:59.999Z`).toISOString() }),
  };

  const { data, isLoading, isError } = useGetAdminTransactionsQuery(params);
  const transactions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All payment records across the platform
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          {...form.register("status")}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Input
          type="date"
          className="h-9 w-auto rounded-lg text-sm"
          {...form.register("fromDate")}
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input type="date" className="h-9 w-auto rounded-lg text-sm" {...form.register("toDate")} />
        {(status || fromDate || toDate) && (
          <button
            type="button"
            onClick={() => {
              form.reset();
              setPage(1);
            }}
            className="h-9 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <PageSkeleton variant="table" />
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load transactions.</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Method
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Razorpay ID
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-foreground">{tx.user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{tx.user.email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-foreground whitespace-nowrap">
                      ₹{(tx.amount / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground uppercase">
                      {tx.method ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          STATUS_BADGE[tx.status] ?? STATUS_BADGE.CANCELLED
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-32 block">
                        {tx.razorpayPaymentId ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {meta.page} of {meta.totalPages} · {meta.total} transactions
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
