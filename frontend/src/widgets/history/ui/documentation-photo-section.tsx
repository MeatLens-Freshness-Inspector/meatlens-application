import { useEffect, useState } from "react";
import { Camera, Clock3, ImageOff } from "lucide-react";
import { format } from "date-fns";
import type { DocumentationPhoto } from "@/entities/documentation-photo";
import type { PendingDocumentationPhoto } from "@/features/offline-sync";

type DocumentationPhotoSectionProps = {
  photos: DocumentationPhoto[];
  pendingPhotos: PendingDocumentationPhoto[];
};

function formatCaptureDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown time" : format(date, "MMM d, yyyy h:mm a");
}

function PendingPhotoCard({ photo }: { photo: PendingDocumentationPhoto }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(new Blob([photo.imageData], { type: photo.imageType }));
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo.imageData, photo.imageType]);

  return (
    <article className="overflow-hidden rounded-xl border border-warning/40 bg-warning/5">
      <div className="aspect-[4/3] bg-secondary">
        {previewUrl ? (
          <img src={previewUrl} alt="Documentation photo waiting to sync" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Clock3 className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold">Waiting to sync</p>
        <p className="mt-1 text-xs text-muted-foreground">Saved on this phone · {formatCaptureDate(photo.capturedAt)}</p>
      </div>
    </article>
  );
}

export function DocumentationPhotoSection({ photos, pendingPhotos }: DocumentationPhotoSectionProps) {
  const hasPhotos = photos.length > 0 || pendingPhotos.length > 0;

  return (
    <section aria-labelledby="documentation-photos-heading" className="rounded-2xl border border-border/70 bg-card/92 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="documentation-photos-heading" className="font-display text-base font-semibold">
            Documentation photos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stall photos saved without a freshness result.
          </p>
        </div>
        <Camera className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      {!hasPhotos ? (
        <div className="mt-4 rounded-xl border border-dashed border-border/70 px-4 py-5 text-center text-sm text-muted-foreground">
          No documentation photos yet.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pendingPhotos.map((photo) => <PendingPhotoCard key={`pending-${photo.id}`} photo={photo} />)}
          {photos.map((photo) => (
            <article key={photo.id} className="overflow-hidden rounded-xl border border-border/70 bg-background/60">
              <div className="aspect-[4/3] bg-secondary">
                {photo.image_url ? (
                  <img src={photo.image_url} alt="Saved documentation" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageOff className="h-8 w-8" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold">Saved photo</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatCaptureDate(photo.captured_at)}</p>
                {photo.location && <p className="mt-1 text-xs text-muted-foreground">{photo.location}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
