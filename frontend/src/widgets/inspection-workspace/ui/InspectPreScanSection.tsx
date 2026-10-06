import { ShieldAlert } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui";
import { Label } from "@/shared/ui";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import type { InspectionPreScanForm } from "@/entities/inspection";

type InspectPreScanSectionProps = {
  form: InspectionPreScanForm;
  isBypassed: boolean;
  isChecklistComplete: boolean;
  isLocked: boolean;
  onFieldChange: (field: keyof InspectionPreScanForm, value: string) => void;
};

type RadioFieldProps = {
  label: string;
  field: keyof InspectionPreScanForm;
  value: string;
  disabled: boolean;
  onFieldChange: (field: keyof InspectionPreScanForm, value: string) => void;
};

const RADIO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

function RadioField({
  label,
  field,
  value,
  disabled,
  onFieldChange,
}: RadioFieldProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </legend>
      <RadioGroup
        value={value}
        disabled={disabled}
        aria-label={label}
        onValueChange={(nextValue) => onFieldChange(field, nextValue)}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {RADIO_OPTIONS.map((option) => {
          const id = `${field}-${option.value}`;
          const isSelected = value === option.value;

          return (
            <Label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex min-h-12 cursor-pointer touch-manipulation items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-input bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <RadioGroupItem
                id={id}
                value={option.value}
                aria-label={`${label}: ${option.label}`}
                className="h-5 w-5 shrink-0"
              />
              <span>{option.label}</span>
            </Label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}

export function InspectPreScanSection({
  form,
  isBypassed,
  isChecklistComplete,
  isLocked,
  onFieldChange,
}: InspectPreScanSectionProps) {
  const areInputsDisabled = isLocked || isBypassed;

  return (
    <section className="mt-4 rounded-3xl border border-border/70 bg-card/92 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-display uppercase tracking-wider text-muted-foreground">
            <ShieldAlert className="h-4 w-4" />
            Pre-Scan Safety Protocol
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Complete this checklist before opening the camera. Any safety answer marked
            <span className="font-semibold text-foreground"> No </span>
            will skip AI and record the inspection as spoiled.
          </p>
        </div>
        <span className="rounded-full border border-border/70 bg-background/55 px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
          {isBypassed ? "Developer Bypass" : isChecklistComplete ? "Checklist Complete" : "Required"}
        </span>
      </div>

      {isBypassed && (
        <div className="mt-4 rounded-2xl border border-warning/30 bg-[hsl(var(--warning)/0.08)] px-4 py-3 text-xs text-foreground">
          Developer bypass active. Pre-scan answers are optional for this session.
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="stall-number"
            className="text-[11px] uppercase tracking-widest text-muted-foreground"
          >
            Stall Number
          </Label>
          <Input
            id="stall-number"
            aria-label="Stall Number"
            value={form.stallNumber}
            disabled={areInputsDisabled}
            onChange={(event) => onFieldChange("stallNumber", event.target.value)}
            className="h-10 rounded-xl"
            placeholder="e.g. 12-A"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="certificate-proof"
            className="text-[11px] uppercase tracking-widest text-muted-foreground"
          >
            Meat Inspection Certificate Proof
          </Label>
          <Input
            id="certificate-proof"
            aria-label="Meat Inspection Certificate Proof"
            value={form.meatInspectionCertificateProof}
            disabled={areInputsDisabled}
            onChange={(event) =>
              onFieldChange("meatInspectionCertificateProof", event.target.value)
            }
            className="h-10 rounded-xl"
            placeholder="Certificate number or proof reference"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="meat-expiry-date"
            className="text-[11px] uppercase tracking-widest text-muted-foreground"
          >
            Meat Expiry Date
          </Label>
          <Input
            id="meat-expiry-date"
            aria-label="Meat Expiry Date"
            type="date"
            value={form.meatExpiryDate}
            disabled={areInputsDisabled}
            onChange={(event) => onFieldChange("meatExpiryDate", event.target.value)}
            className="h-10 rounded-xl"
          />
        </div>

        <RadioField
          label="Storage Correct"
          field="storageCorrect"
          value={form.storageCorrect}
          disabled={areInputsDisabled}
          onFieldChange={onFieldChange}
        />

        <RadioField
          label="Light Color Correct"
          field="lightColorCorrect"
          value={form.lightColorCorrect}
          disabled={areInputsDisabled}
          onFieldChange={onFieldChange}
        />

        {!isBypassed && form.lightColorCorrect === "no" && (
          <div className="space-y-2">
            <Label
              htmlFor="light-color-observed"
              className="text-[11px] uppercase tracking-widest text-muted-foreground"
            >
              What Color?
            </Label>
            <Input
              id="light-color-observed"
              aria-label="What Color?"
              value={form.lightColorObserved}
              disabled={areInputsDisabled}
              onChange={(event) => onFieldChange("lightColorObserved", event.target.value)}
              className="h-10 rounded-xl"
              placeholder="Describe the observed light color"
            />
          </div>
        )}

        <RadioField
          label="Area Clean"
          field="areaClean"
          value={form.areaClean}
          disabled={areInputsDisabled}
          onFieldChange={onFieldChange}
        />
      </div>
    </section>
  );
}
