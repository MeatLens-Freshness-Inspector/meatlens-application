import { Button } from "@/shared/ui";
import { Clock, Loader2, RotateCcw, Save } from "lucide-react";
import type { InspectionSaveStatus } from "../types";

type InspectActionsSectionProps = {
  saveStatus: InspectionSaveStatus;
  isCreateInspectionPending: boolean;
  isDisputePending: boolean;
  saveButtonLabel: string;
  resetButtonLabel: string;
  onReset: () => void;
  onSave: () => void;
};

export function InspectActionsSection({
  saveStatus,
  isCreateInspectionPending,
  isDisputePending,
  saveButtonLabel,
  resetButtonLabel,
  onReset,
  onSave,
}: InspectActionsSectionProps) {
  const hasCompletedSave = saveStatus === "saved" || saveStatus === "queued";

  return (
    <section className="mt-4 rounded-3xl border border-border/70 bg-card/92 p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant={hasCompletedSave ? "default" : "outline"}
          onClick={onReset}
          disabled={saveStatus === "saving" || isCreateInspectionPending || isDisputePending}
          className="flex-1 gap-2 rounded-xl"
        >
          <RotateCcw className="h-4 w-4" />
          {resetButtonLabel}
        </Button>
        <Button
          variant={hasCompletedSave ? "outline" : "default"}
          onClick={onSave}
          disabled={saveStatus !== "idle" || isCreateInspectionPending}
          className="flex-1 gap-2 rounded-xl"
        >
          {saveStatus === "saving" || isCreateInspectionPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveStatus === "queued" ? (
            <Clock className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveButtonLabel}
        </Button>
      </div>
    </section>
  );
}
