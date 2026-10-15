import React from "react";
import { ArrowLeft, MessageSquare, RefreshCw, Search, Send, Shield } from "lucide-react";
import { tutorialFixtures } from "../../model/tutorial-fixtures";
import type { TutorialStepDefinition } from "../../model/inspection-tutorial";
import { MockHotspot } from "../mock-hotspot";
import { TutorialAppShell } from "../tutorial-app-shell";

interface MessagesMockSceneProps {
  step: TutorialStepDefinition;
  onAdvance: () => void;
}

export function MessagesMockScene({ step, onAdvance }: MessagesMockSceneProps) {
  const fixture = tutorialFixtures.messages;
  const isDirectory = step.id === "messages-directory";

  return (
    <TutorialAppShell
      activeTab="messages"
      title={isDirectory ? "Messages" : "Chat"}
      subtitle={isDirectory ? "Choose someone to message." : "Chat and send a message"}
    >
      <div className="flex flex-col gap-3 p-3">
        {isDirectory ? (
          <>
            <section className="rounded-2xl border border-border/70 bg-card/90 p-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <p className="font-display text-sm font-semibold">Messages</p>
              </div>
              <p className="mt-1 text-[9px] text-muted-foreground">Choose someone to message.</p>
            </section>
            <section className="rounded-2xl border border-border/70 bg-card/90 p-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[10px] font-semibold">People you can message</h2>
                <span className="flex items-center gap-1 text-[8px] text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5" />Refresh contacts
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-2 py-2 text-[9px] text-muted-foreground">
                <Search className="h-3.5 w-3.5" />Find a person by name
              </div>
              <MockHotspot active onAdvance={onAdvance} label="Message" ariaLabel={step.hotspotLabel}>
                <div className="mt-2 rounded-2xl border border-primary/40 bg-[hsl(var(--primary)/0.16)] p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display text-[10px] font-semibold">{fixture.contactLabel}</p>
                      <p className="mt-0.5 text-[8px] uppercase tracking-[0.14em] text-muted-foreground">{fixture.contactRoleLabel}</p>
                    </div>
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-2 text-[9px] font-semibold text-primary">Message</p>
                </div>
              </MockHotspot>
            </section>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60"><ArrowLeft className="h-3.5 w-3.5" /></div><div><p className="font-display text-[10px] font-semibold">Chat with {fixture.contactLabel}</p><p className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground">{fixture.contactRoleLabel}</p></div></div><span className="rounded-full border border-fresh/30 bg-fresh/10 px-2 py-1 text-[8px] text-fresh">Connected</span></div>
            <section className="rounded-2xl border border-border/70 bg-card/92 p-3"><div className="flex min-h-[160px] items-center justify-center rounded-xl bg-background/50 text-center"><div><p className="font-display text-[10px] uppercase tracking-wider">No messages yet</p><p className="mt-1 text-[9px] text-muted-foreground">Send the first message to start this chat.</p></div></div><div className="mt-2 flex items-center gap-2 border-t border-border/70 pt-2"><div className="h-8 flex-1 rounded-xl border border-border/70 bg-background/85 px-2 py-2 text-[8px] text-muted-foreground">Type your message</div><MockHotspot active onAdvance={onAdvance} label="Send" ariaLabel={step.hotspotLabel}><div className="flex h-8 items-center gap-1 rounded-xl bg-primary px-2 text-[8px] font-semibold text-primary-foreground"><Send className="h-3 w-3" />Send</div></MockHotspot></div></section>
            <p className="text-center text-[8px] text-muted-foreground">Connected · {fixture.messageCountLabel}</p>
            <p className="text-center text-[8px] text-muted-foreground">{fixture.offlineStatusLabel}; reconnect when the session is online.</p>
          </>
        )}
      </div>
    </TutorialAppShell>
  );
}
