import { MapPin, Microscope } from "lucide-react";

type InspectHeroSectionProps = {
  locationDisplayLabel: string;
};

export function InspectHeroSection({ locationDisplayLabel }: InspectHeroSectionProps) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.65)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-[hsl(var(--primary)/0.16)]">
          <Microscope className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold tracking-tight">Inspect</h1>
          <p className="text-xs text-muted-foreground">Check a meat sample quickly</p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 items-center gap-2 rounded-2xl border border-border/70 bg-[hsl(var(--warning)/0.12)] px-3 py-2.5">
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Market</p>
          <p className="truncate text-sm font-semibold text-foreground">
            {locationDisplayLabel || "Select a market below"}
          </p>
        </div>
      </div>
    </section>
  );
}
