import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Camera, ChevronDown, ChevronUp, Clock3, Hash, ImageOff, MapPin } from "lucide-react";
import type { DocumentationPhoto } from "@/entities/documentation-photo";
import type { PendingDocumentationPhoto } from "@/features/offline-sync";
import { Button } from "@/shared/ui";
import { Card, CardContent } from "@/shared/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/utils";

type DocumentationPhotoSectionProps = {
  photos: DocumentationPhoto[];
  pendingPhotos: PendingDocumentationPhoto[];
};

type DocumentationPhotoEntry =
  | {
      kind: "saved";
      key: string;
      capturedAt: string;
      location: string | null;
      photo: DocumentationPhoto;
    }
  | {
      kind: "pending";
      key: string;
      capturedAt: string;
      location: string | null;
      photo: PendingDocumentationPhoto;
    };

function getCaptureTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatCaptureDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : format(date, "MMM d, yyyy");
}

function formatCaptureTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown time" : format(date, "h:mm a");
}

function DocumentationPhotoListItem({ entry }: { entry: DocumentationPhotoEntry }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const isPending = entry.kind === "pending";

  useEffect(() => {
    if (!isPending) {
      setPendingPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(
      new Blob([entry.photo.imageData], { type: entry.photo.imageType }),
    );
    setPendingPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [entry, isPending]);

  const imageUrl = isPending ? pendingPreviewUrl : entry.photo.image_url;
  const photoId = entry.photo.id.slice(0, 6);
  const statusLabel = isPending ? "Waiting to sync" : "Documentation photo";

  return (
    <Card className="rounded-2xl border border-border/70 bg-card/95 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_35px_-24px_rgba(0,0,0,0.75)]">
      <CardContent
        data-testid="documentation-photo-card-layout"
        className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
      >
        {imageUrl ? (
          <button
            type="button"
            className="h-14 w-14 flex-shrink-0 cursor-zoom-in touch-manipulation overflow-hidden rounded-xl border border-border/70 sm:h-16 sm:w-16"
            onClick={() => setIsPreviewOpen(true)}
            aria-label="View full documentation photo"
          >
            <img
              src={imageUrl}
              alt="Documentation photo"
              className="h-full w-full object-cover"
            />
          </button>
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-border/70 bg-[hsl(var(--primary)/0.08)] sm:h-16 sm:w-16">
            {isPending ? (
              <Clock3 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ImageOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border/70 bg-background/65 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              {formatCaptureDate(entry.capturedAt)}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest",
                isPending
                  ? "border-warning/40 bg-[hsl(var(--warning)/0.12)] text-warning"
                  : "border-primary/30 bg-[hsl(var(--primary)/0.08)] text-primary",
              )}
            >
              {statusLabel}
            </span>
          </div>

          <p className="truncate font-display text-sm font-semibold">Stall documentation</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-warning">
            No analysis result
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatCaptureTime(entry.capturedAt)}</p>

          {entry.location && (
            <p className="mt-1 flex items-start gap-1 break-words text-xs leading-snug text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span>{entry.location}</span>
            </p>
          )}
        </div>

        <div className="col-span-2 flex items-end justify-between gap-3 border-t border-border/60 pt-2 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
          <p className="font-display text-lg font-bold text-muted-foreground">—</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">no analysis</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            <Hash className="h-3 w-3" />
            {photoId}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 h-9 w-full rounded-lg px-3 text-xs sm:w-auto"
            onClick={() => setIsPreviewOpen(true)}
            disabled={!imageUrl}
          >
            View photo
          </Button>
        </div>
      </CardContent>

      {imageUrl && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="w-[min(96vw,980px)] max-w-5xl border-none bg-transparent p-0 shadow-none">
            <DialogTitle className="sr-only">Documentation photo preview</DialogTitle>
            <DialogDescription className="sr-only">
              Full-size documentation photo for this stall.
            </DialogDescription>
            <img
              src={imageUrl}
              alt="Full documentation photo"
              className="max-h-[85vh] w-full rounded-2xl border border-border/70 bg-black/60 object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

export function DocumentationPhotoSection({ photos, pendingPhotos }: DocumentationPhotoSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const entries = useMemo<DocumentationPhotoEntry[]>(
    () => [
      ...pendingPhotos.map((photo) => ({
        kind: "pending" as const,
        key: `pending-${photo.id}`,
        capturedAt: photo.capturedAt,
        location: photo.location,
        photo,
      })),
      ...photos.map((photo) => ({
        kind: "saved" as const,
        key: `saved-${photo.id}`,
        capturedAt: photo.captured_at,
        location: photo.location,
        photo,
      })),
    ].sort((left, right) => getCaptureTimestamp(right.capturedAt) - getCaptureTimestamp(left.capturedAt)),
    [pendingPhotos, photos],
  );
  const visibleEntries = isExpanded ? entries : entries.slice(0, 3);
  const hasMoreEntries = entries.length > visibleEntries.length;

  return (
    <section
      aria-labelledby="documentation-photos-heading"
      className="rounded-3xl border border-border/70 bg-card/92 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="documentation-photos-heading" className="font-display text-base font-semibold">
              Documentation photos
            </h2>
            <span className="rounded-full border border-border/70 bg-background/55 px-3 py-1 text-[11px] text-muted-foreground">
              {entries.length} photo{entries.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Same history format, marked as no analysis result.
          </p>
        </div>
        <Camera className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No documentation photos yet.</p>
      ) : (
        <>
          <div className="mt-3 space-y-3">
            {visibleEntries.map((entry) => (
              <DocumentationPhotoListItem key={entry.key} entry={entry} />
            ))}
          </div>
          {(hasMoreEntries || isExpanded) && (
            <Button
              type="button"
              variant="outline"
              className="mt-3 h-10 w-full rounded-xl"
              onClick={() => setIsExpanded((expanded) => !expanded)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" aria-hidden="true" />
                  Show fewer documentation photos
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" aria-hidden="true" />
                  Show all documentation photos
                </>
              )}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
