// /types/api/images.ts
export interface ImageDTO {
  id: number;
  filename: string;
  storagePath: string | null;
  storageProvider: string | null;
  order: number;
  createdAt: string;
}
