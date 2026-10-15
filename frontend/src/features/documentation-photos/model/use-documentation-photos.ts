import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/entities/user";
import { documentationPhotoClient, type DocumentationPhoto } from "@/entities/documentation-photo";
import { getPendingDocumentationPhotos, type PendingDocumentationPhoto } from "@/features/offline-sync";

export const documentationPhotoKeys = {
  all: ["documentation-photos"] as const,
  list: (userId: string) => ["documentation-photos", userId] as const,
};

export type DocumentationPhotoHistory = {
  photos: DocumentationPhoto[];
  pending: PendingDocumentationPhoto[];
};

export function useDocumentationPhotos() {
  const { user } = useAuth();
  const query = useQuery<DocumentationPhotoHistory>({
    queryKey: documentationPhotoKeys.list(user?.id ?? "anonymous"),
    enabled: Boolean(user),
    queryFn: async () => {
      const pending = (await getPendingDocumentationPhotos()).filter((photo) => photo.userId === user?.id);
      if (!navigator.onLine) return { photos: [], pending };

      return {
        photos: await documentationPhotoClient.list(),
        pending,
      };
    },
  });
  const refetch = query.refetch;

  useEffect(() => {
    const refresh = () => void refetch();
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refetch]);

  return {
    photos: query.data?.photos ?? [],
    pendingPhotos: query.data?.pending ?? [],
    isLoading: query.isLoading,
  };
}
