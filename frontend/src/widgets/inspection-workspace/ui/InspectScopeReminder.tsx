import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Link } from "react-router-dom";
import {
  inspectScopeReminder,
  scopeReferencePath,
} from "@/widgets/legal";

export function InspectScopeReminder() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="mt-4 rounded-3xl border border-border/70 bg-card/92 p-4 shadow-[0_18px_55px_-34px_rgba(0,0,0,0.55)]">
      <div className="border-l-2 border-primary/80 pl-3.5 py-0.5">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-controls="inspect-scope-reminder-content"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Hide scope reminder details" : "Show scope reminder details"}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-[hsl(var(--primary)/0.16)] text-primary">
              <Info className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-base font-semibold tracking-tight text-foreground">
              {inspectScopeReminder.title}
            </span>
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>

        {isExpanded && (
          <div id="inspect-scope-reminder-content">
            <ul className="mt-2.5 space-y-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
          {inspectScopeReminder.bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-2">
              <span className="text-muted-foreground select-none">•</span>
              <span className="text-foreground">{bullet}</span>
            </li>
          ))}
            </ul>

            <div className="mt-3.5">
          <Link
            to={scopeReferencePath}
            className="group inline-flex h-8 items-center gap-1.5 rounded-xl border border-border/80 bg-background/60 px-3 text-xs font-medium text-foreground transition-all hover:bg-background hover:text-primary hover:border-border"
          >
            <span>{inspectScopeReminder.ctaLabel}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
