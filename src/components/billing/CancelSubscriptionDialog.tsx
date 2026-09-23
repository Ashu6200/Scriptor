"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCancelSubscriptionMutation } from "@/features/billing/api";
import { useState } from "react";

interface Props {
  workspaceId: string;
  periodEnd?: string | null;
}

export function CancelSubscriptionDialog({ workspaceId, periodEnd }: Props) {
  const [open, setOpen] = useState(false);
  const [cancel, { isLoading }] = useCancelSubscriptionMutation();

  const handleConfirm = async () => {
    try {
      await cancel({ workspaceId, cancelAtPeriodEnd: true }).unwrap();
      setOpen(false);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        Cancel Subscription
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            {periodEnd
              ? `Your subscription will remain active until ${periodEnd}. After that, your workspace will move to the Free plan.`
              : "Your subscription will remain active until the end of the current billing period. After that, your workspace will move to the Free plan."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Keep Plan
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Cancelling..." : "Confirm Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
