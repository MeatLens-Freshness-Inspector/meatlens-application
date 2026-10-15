import { createAuthHeaders } from "@/shared/api/auth-headers";
import { API_BASE_URL } from "@/shared/api/base-url";
import { fetchWithTimeout } from "@/shared/api";
import type { DocumentationPhoto, DocumentationPhotoInsert } from "../model/types";

export class DocumentationPhotoClient {
  async list(limit = 100): Promise<DocumentationPhoto[]> {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/documentation-photos?limit=${limit}`,
      { headers: createAuthHeaders() },
    );
    if (!res.ok) throw new Error(`Failed to fetch documentation photos: ${res.statusText}`);
    return res.json();
  }

  async create(input: DocumentationPhotoInsert): Promise<DocumentationPhoto> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/documentation-photos`, {
      method: "POST",
      headers: createAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Failed to save documentation photo" }));
      throw new Error(body.error || `Failed to save documentation photo: ${res.statusText}`);
    }
    return res.json();
  }
}

export const documentationPhotoClient = new DocumentationPhotoClient();
