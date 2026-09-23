"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileText, LayoutGrid, Rocket } from "lucide-react";
import { useEffect, useState } from "react";

const STEPS = [
  {
    icon: Rocket,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    title: "Welcome to Scriptor!",
    description:
      "Your developer-first knowledge base is ready. Let's walk you through the key features so you can hit the ground running.",
  },
  {
    icon: LayoutGrid,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/10",
    title: "Create a Workspace",
    description:
      "Workspaces keep your documents organised by project or team. Head to Workspaces in the sidebar and create your first one.",
  },
  {
    icon: FileText,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    title: "Write your first document",
    description:
      "Open a workspace and hit the + button to start a new doc. Use the rich editor to capture architecture decisions, RFCs, and runbooks.",
  },
];

const STORAGE_KEY = "scriptor_onboarding_complete";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div
            className={`h-14 w-14 rounded-2xl ${current.iconBg} flex items-center justify-center`}
          >
            <Icon className={`h-7 w-7 ${current.iconColor}`} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-muted-foreground"
            onClick={handleClose}
          >
            Skip
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => (isLast ? handleClose() : setStep((s) => s + 1))}
          >
            {isLast ? "Get Started" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
