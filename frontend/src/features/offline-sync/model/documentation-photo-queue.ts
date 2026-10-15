import { Capacitor } from "@capacitor/core";
import * as sqliteImpl from "../api/sqlite-documentation-photo-queue";

const isNative = () => Capacitor.isNativePlatform();
const DB_NAME = "meatlens-offline";
const DB_VERSION = 2;
const SCAN_STORE_NAME = "pending-scans";
const STORE_NAME = "pending-documentation-photos";

export interface PendingDocumentationPhoto {
  id: string;
  imageData: ArrayBuffer;
  imageType: string;
  imageName: string;
  location: string | null;
  locationLatitude: number | null;
  locationLongitude: number | null;
  stallNumber: string | null;
  capturedAt: string;
  queuedAt: string;
  userId: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SCAN_STORE_NAME)) {
        db.createObjectStore(SCAN_STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueDocumentationPhoto(photo: PendingDocumentationPhoto): Promise<void> {
  if (isNative()) return sqliteImpl.queueDocumentationPhoto(photo);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(photo);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingDocumentationPhotos(): Promise<PendingDocumentationPhoto[]> {
  if (isNative()) return sqliteImpl.getPendingDocumentationPhotos();
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as PendingDocumentationPhoto[]);
    request.onerror = () => reject(request.error);
  });
}

export async function removeDocumentationPhoto(id: string): Promise<void> {
  if (isNative()) return sqliteImpl.removeDocumentationPhoto(id);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearPendingDocumentationPhotos(): Promise<void> {
  if (isNative()) return sqliteImpl.clearPendingDocumentationPhotos();
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
