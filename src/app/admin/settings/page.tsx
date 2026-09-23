"use client";

import {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingMutation,
} from "@/features/admin/api";
import { Check, Megaphone, Save, Wrench } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface SettingCardProps {
  settingKey: string;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  type: "text" | "toggle";
  currentValue?: string;
  onSave: (key: string, value: string) => Promise<void>;
}

function SettingCard({
  settingKey,
  label,
  description,
  icon: Icon,
  accent,
  type,
  currentValue,
  onSave,
}: SettingCardProps) {
  const [value, setValue] = useState(currentValue ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isToggle = type === "toggle";
  const isOn = value === "true";

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settingKey, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    const newValue = isOn ? "false" : "true";
    setValue(newValue);
    setIsSaving(true);
    try {
      await onSave(settingKey, newValue);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const [prevCurrentValue, setPrevCurrentValue] = useState(currentValue);

  if (currentValue !== prevCurrentValue) {
    setPrevCurrentValue(currentValue);
    if (!isSaving) {
      setValue(currentValue ?? "");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <div className={`h-10 w-10 rounded-lg ${accent} flex items-center justify-center shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>

          {isToggle ? (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggle}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isOn ? "bg-primary" : "bg-neutral-300 dark:bg-neutral-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-1 ${
                    isOn ? "translate-x-6 ml-0" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm font-semibold text-muted-foreground">
                {isOn ? "Enabled" : "Disabled"}
              </span>
              {saved && (
                <span className="text-xs text-emerald-500 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={3}
                placeholder="Enter announcement message..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || value === currentValue}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? "Saving..." : "Save"}
                </button>
                {saved && (
                  <span className="text-xs text-emerald-500 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useGetPlatformSettingsQuery();
  const [updateSetting] = useUpdatePlatformSettingMutation();

  const handleSave = async (key: string, value: string) => {
    await updateSetting({ key, value }).unwrap();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Platform Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Global broadcast, maintenance mode, and infrastructure controls
        </p>
      </div>

      <div className="space-y-4">
        <SettingCard
          settingKey="announcement_banner"
          label="Global Announcement Banner"
          description="Broadcast a message across all users' screens (e.g. maintenance, new features)."
          icon={Megaphone}
          accent="bg-amber-500/15 text-amber-500"
          type="text"
          currentValue={settings?.announcement_banner ?? ""}
          onSave={handleSave}
        />

        <SettingCard
          settingKey="maintenance_mode"
          label="Emergency Maintenance Mode"
          description="When enabled, all workspace API calls return 503 Service Unavailable."
          icon={Wrench}
          accent="bg-rose-500/15 text-rose-500"
          type="toggle"
          currentValue={settings?.maintenance_mode ?? "false"}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
