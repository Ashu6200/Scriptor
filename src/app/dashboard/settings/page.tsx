"use client";

import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useChangePasswordMutation,
  useGetProfileQuery,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useUpdateProfileMutation,
} from "@/features/user/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Laptop, Loader2, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  image: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/iPhone|iPad|iOS/.test(ua)) return "iOS Device";
  if (/Android/.test(ua)) return "Android Device";
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Browser";
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPw }] = useChangePasswordMutation();
  const { data: sessions } = useGetSessionsQuery();
  const [revokeSession] = useRevokeSessionMutation();
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const profileForm = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (profile) {
      profileForm.reset({ name: profile.name, image: profile.image ?? "" });
    }
  }, [profile, profileForm]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile({ name: data.name, image: data.image || null }).unwrap();
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).unwrap();
      toast.success("Password changed successfully.");
      passwordForm.reset();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to change password. Check your current password."
      );
    }
  };

  const handleRevokeSession = async (token: string) => {
    try {
      await revokeSession({ token }).unwrap();
      toast.success("Session signed out.");
    } catch {
      toast.error("Failed to revoke session.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto p-4 lg:p-6">
        <PageSkeleton variant="page-header" />
        <PageSkeleton variant="form" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and profile.</p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold mb-4">Profile</h2>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <FormField
              control={profileForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                value={profile?.email ?? ""}
                disabled
                className="opacity-60"
              />
              <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
            </div>
            <FormField
              control={profileForm.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </form>
        </Form>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold mb-1">Change Password</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Update your password to keep your account secure.
        </p>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrentPw ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPw ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      type={showNewPw ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isChangingPw}>
              {isChangingPw ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Password
            </Button>
          </form>
        </Form>
      </div>

      {/* Active Sessions */}
      {sessions && sessions.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-base font-semibold mb-1">Active Sessions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Devices currently signed in to your account.
          </p>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Laptop className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      {parseUserAgent(s.userAgent)}
                      {s.isCurrent && (
                        <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/20">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {s.ipAddress ?? "Unknown IP"} ·{" "}
                      {new Date(s.updatedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {!s.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(s.token)}
                    className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appearance */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            Customize how the interface looks on your device.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all cursor-pointer ${
              theme === "light"
                ? "border-primary bg-primary/10 font-semibold"
                : "border-border hover:bg-accent"
            }`}
          >
            <Sun className="h-6 w-6 text-amber-500" />
            <span className="text-xs">Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all cursor-pointer ${
              theme === "dark"
                ? "border-primary bg-primary/10 font-semibold"
                : "border-border hover:bg-accent"
            }`}
          >
            <Moon className="h-6 w-6 text-primary" />
            <span className="text-xs">Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all cursor-pointer ${
              theme === "system"
                ? "border-primary bg-primary/10 font-semibold"
                : "border-border hover:bg-accent"
            }`}
          >
            <Monitor className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs">System</span>
          </button>
        </div>
      </div>
    </div>
  );
}
