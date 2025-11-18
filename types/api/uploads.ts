// /types/api/uploads.ts
export type UploadResponse = {
  ok: true;
  urls: string[]; // public URLs (or local /uploads/ paths)
};

export type UploadErrorResponse = {
  ok: false;
  error?: string;
  urls: string[];
};
