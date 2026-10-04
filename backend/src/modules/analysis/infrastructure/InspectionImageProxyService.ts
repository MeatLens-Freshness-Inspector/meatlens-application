const INSPECTION_IMAGE_BUCKET = "inspection-images";
const MAX_INSPECTION_IMAGE_BYTES = 10 * 1024 * 1024;

export interface PublicInspectionImageInput {
  supabaseUrl: string;
  userId: string;
  fileName: string;
}

export interface PublicInspectionImage {
  body: Buffer;
  contentType: string;
}

export function buildInspectionImagePublicUrl(
  supabaseUrl: string,
  userId: string,
  fileName: string,
): string {
  const baseUrl = supabaseUrl.replace(/\/+$/, "");
  return `${baseUrl}/storage/v1/object/public/${INSPECTION_IMAGE_BUCKET}/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`;
}

export async function fetchPublicInspectionImage(
  input: PublicInspectionImageInput,
  fetchImpl: typeof fetch = fetch,
): Promise<PublicInspectionImage> {
  const response = await fetchImpl(
    buildInspectionImagePublicUrl(input.supabaseUrl, input.userId, input.fileName),
  );

  if (!response.ok) {
    throw new Error(`Inspection image request failed with HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim() ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error("Inspection image response was not image data");
  }

  const body = Buffer.from(await response.arrayBuffer());
  if (body.length === 0 || body.length > MAX_INSPECTION_IMAGE_BYTES) {
    throw new Error("Inspection image response has an invalid size");
  }

  return { body, contentType };
}
