export interface DocumentationPhoto {
  id: string;
  user_id: string;
  client_submission_id: string;
  image_url: string;
  location: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  stall_number: string | null;
  captured_at: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentationPhotoInsert {
  client_submission_id: string;
  image_url: string;
  location?: string | null;
  location_latitude?: number | null;
  location_longitude?: number | null;
  stall_number?: string | null;
  captured_at: string;
}
