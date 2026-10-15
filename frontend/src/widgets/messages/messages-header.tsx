import { MessageSquare } from "lucide-react";

export function MessagesHeader() {
  return (
    <section className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.65)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-[hsl(var(--primary)/0.16)]">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Messages</h1>
          <p className="text-xs text-muted-foreground">Choose someone to message.</p>
        </div>
      </div>
    </section>
  );
}
