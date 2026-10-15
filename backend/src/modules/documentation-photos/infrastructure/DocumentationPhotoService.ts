import { supabase } from "../../../integrations/supabase";
import type {
  DocumentationPhoto,
  DocumentationPhotoInsert,
} from "../../../types/documentationPhoto";

export type CreateDocumentationPhotoResult = {
  photo: DocumentationPhoto;
  created: boolean;
};

type SupabaseWriteError = { code?: string | null; message: string };

const DOCUMENTATION_PHOTO_COLUMNS =
  "id, user_id, client_submission_id, image_url, location, location_latitude, location_longitude, stall_number, captured_at, created_at, updated_at";

export class DocumentationPhotoService {
  private readonly tableName = "documentation_photos";

  async getAll(limit: number, userId: string): Promise<DocumentationPhoto[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(DOCUMENTATION_PHOTO_COLUMNS)
      .eq("user_id", userId)
      .order("captured_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch documentation photos: ${error.message}`);
    return (data as unknown as DocumentationPhoto[]) ?? [];
  }

  async create(
    input: DocumentationPhotoInsert,
    userId: string,
  ): Promise<CreateDocumentationPhotoResult> {
    const existing = await this.getByClientSubmissionId(input.client_submission_id, userId);
    if (existing) return { photo: existing, created: false };

    const { data, error } = await (supabase.from(this.tableName) as any)
      .insert({
        ...input,
        user_id: userId,
      })
      .select(DOCUMENTATION_PHOTO_COLUMNS)
      .single();

    if (error) {
      if (this.isDuplicateClientSubmissionError(error)) {
        const duplicate = await this.getByClientSubmissionId(input.client_submission_id, userId);
        if (duplicate) return { photo: duplicate, created: false };
      }

      throw new Error(`Failed to create documentation photo: ${error.message}`);
    }

    return { photo: data as unknown as DocumentationPhoto, created: true };
  }

  private async getByClientSubmissionId(
    clientSubmissionId: string,
    userId: string,
  ): Promise<DocumentationPhoto | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(DOCUMENTATION_PHOTO_COLUMNS)
      .eq("client_submission_id", clientSubmissionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(`Failed to check documentation photo: ${error.message}`);
    return data as unknown as DocumentationPhoto | null;
  }

  private isDuplicateClientSubmissionError(error: SupabaseWriteError): boolean {
    return error.code === "23505" || error.message.toLowerCase().includes("duplicate");
  }
}

export const documentationPhotoService = new DocumentationPhotoService();
