import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useCallback, useEffect, useRef } from "react";
import { PrivacyPolicyContent } from "./privacy-policy-content";
import { isTermsScrollAtBottom } from "./terms-dialog-scroll";

interface PrivacyPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReadToEnd?: () => void;
}

export function PrivacyPolicyDialog({ open, onOpenChange, onReadToEnd }: PrivacyPolicyDialogProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const notifyIfReadToEnd = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) {
      return;
    }

    if (isTermsScrollAtBottom(scrollContainer)) {
      onReadToEnd?.();
    }
  }, [onReadToEnd]);

  useEffect(() => {
    if (!open) {
      return;
    }

    notifyIfReadToEnd();
  }, [notifyIfReadToEnd, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border/70 px-6 py-4">
          <DialogTitle className="font-display text-lg uppercase tracking-wider">MeatLens Privacy Policy</DialogTitle>
          <DialogDescription>Last Updated: May 8, 2026</DialogDescription>
        </DialogHeader>
        <div
          ref={scrollContainerRef}
          data-testid="privacy-scroll-container"
          className="max-h-[70vh] overflow-y-auto px-6 py-5"
          onScroll={notifyIfReadToEnd}
        >
          <PrivacyPolicyContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
