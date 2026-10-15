import { openDb } from "@/shared/platform/sqlite";
import type { PendingDocumentationPhoto } from "../model/documentation-photo-queue";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

function rowToPhoto(row: Record<string, unknown>): PendingDocumentationPhoto {
  return {
    id: row.id as string,
    imageData: base64ToArrayBuffer(row.image_data as string),
    imageType: row.image_type as string,
    imageName: row.image_name as string,
    location: (row.location as string | null) ?? null,
    locationLatitude: (row.location_latitude as number | null) ?? null,
    locationLongitude: (row.location_longitude as number | null) ?? null,
    stallNumber: (row.stall_number as string | null) ?? null,
    capturedAt: row.captured_at as string,
    queuedAt: row.queued_at as string,
    userId: row.user_id as string,
  };
}

export async function queueDocumentationPhoto(photo: PendingDocumentationPhoto): Promise<void> {
  const db = await openDb();
  await db.run(
    `INSERT OR REPLACE INTO pending_documentation_photos (
      id, image_data, image_type, image_name, location,
      location_latitude, location_longitude, stall_number,
      captured_at, queued_at, user_id, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      photo.id,
      arrayBufferToBase64(photo.imageData),
      photo.imageType,
      photo.imageName,
      photo.location,
      photo.locationLatitude,
      photo.locationLongitude,
      photo.stallNumber,
      photo.capturedAt,
      photo.queuedAt,
      photo.userId,
    ],
  );
}

export async function getPendingDocumentationPhotos(): Promise<PendingDocumentationPhoto[]> {
  const db = await openDb();
  const result = await db.query(
    "SELECT * FROM pending_documentation_photos WHERE sync_status != 'synced' ORDER BY queued_at ASC",
  );
  return (result.values ?? []).map((row) => rowToPhoto(row as Record<string, unknown>));
}

export async function removeDocumentationPhoto(id: string): Promise<void> {
  const db = await openDb();
  await db.run("DELETE FROM pending_documentation_photos WHERE id = ?", [id]);
}

export async function clearPendingDocumentationPhotos(): Promise<void> {
  const db = await openDb();
  await db.run("DELETE FROM pending_documentation_photos");
}
