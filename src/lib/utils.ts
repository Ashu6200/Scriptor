import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseIntervalToSeconds(input?: string | null): number | null {
  if (!input || !input.trim()) return null;
  const match = input.trim().match(/^(\d+)\s*([smhd])?$/i);
  if (!match) return null;

  const val = Number.parseInt(match[1], 10);
  const unit = (match[2] || "s").toLowerCase();

  switch (unit) {
    case "s":
      return val;
    case "m":
      return val * 60;
    case "h":
      return val * 3600;
    case "d":
      return val * 86400;
    default:
      return val;
  }
}

export function formatIntervalSeconds(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "N/A";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
