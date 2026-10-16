import { createAuthHeaders } from "@/shared/api/auth-headers";
import { API_BASE_URL } from "@/shared/api/base-url";
import { UPLOAD_REQUEST_TIMEOUT_MS, fetchWithTimeout } from "@/shared/api";

export function resolveUploadedInspectionImageUrl(payload: unknown): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Inspection image upload did not return a usable image URL");
  }

  const record = payload as Record<string, unknown>;
  const imageUrl = typeof record.imageUrl === "string"
    ? record.imageUrl
    : typeof record.image_url === "string"
      ? record.image_url
      : "";
  const normalizedImageUrl = imageUrl.trim();

  if (!normalizedImageUrl) {
    throw new Error("Inspection image upload did not return a usable image URL");
  }

  return normalizedImageUrl;
}

export class UploadClient {
  private static instance: UploadClient;

  private constructor() {}

  static getInstance(): UploadClient {
    if (!UploadClient.instance) {
      UploadClient.instance = new UploadClient();
    }
    return UploadClient.instance;
  }

  private createHeaders(initialHeaders?: HeadersInit): Headers {
    return createAuthHeaders(initialHeaders);
  }

  /**
   * Upload an inspection image through the backend API
   * @param file The image file to upload
   * @returns The public URL of the uploaded image
   */
  async uploadInspectionImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetchWithTimeout(`${API_BASE_URL}/upload/inspection-image`, {
      method: "POST",
      headers: this.createHeaders(),
      body: formData,
    }, UPLOAD_REQUEST_TIMEOUT_MS);

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || `Upload failed: ${res.statusText}`);
    }

    return resolveUploadedInspectionImageUrl(await res.json());
  }
}

export const uploadClient = UploadClient.getInstance();
