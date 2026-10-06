import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useCallback, useEffect, useRef } from "react";
import { TermsAndConditionsContent } from "@/widgets/legal/terms-content";
import { isTermsScrollAtBottom } from "./terms-dialog-scroll";

interface TermsAndConditionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReadToEnd?: () => void;
}

export function TermsAndConditionsDialog({
  open,
  onOpenChange,
  onReadToEnd,
}: TermsAndConditionsDialogProps) {
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
          <DialogTitle className="font-display text-lg uppercase tracking-wider">MeatLens Terms and Conditions</DialogTitle>
          <DialogDescription>Field-use policy and responsibilities for inspectors and market users.</DialogDescription>
        </DialogHeader>
        <div
          ref={scrollContainerRef}
          data-testid="terms-scroll-container"
          className="max-h-[70vh] overflow-y-auto px-6 py-5"
          onScroll={notifyIfReadToEnd}
        >
          <TermsAndConditionsContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
