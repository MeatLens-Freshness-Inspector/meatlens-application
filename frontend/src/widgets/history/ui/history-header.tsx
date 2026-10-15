import { ClipboardList } from "lucide-react";

type HistoryHeaderProps = {
  totalInspections: number;
};

export function HistoryHeader({ totalInspections }: HistoryHeaderProps) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.65)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-[hsl(var(--primary)/0.16)]">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">History</h1>
          <p className="text-xs text-muted-foreground">
            Open a saved inspection to review its result.
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-2xl border border-border/70 bg-background/55 px-3 py-2 text-sm text-muted-foreground">
        {totalInspections} saved inspection{totalInspections === 1 ? "" : "s"}
      </p>
    </section>
  );
}
