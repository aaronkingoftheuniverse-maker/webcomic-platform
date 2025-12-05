import { promises as fs } from "fs";
import path from "path";

/**
 * Validates and saves an uploaded file to a specified subfolder within the public/uploads directory.
 *
 * @param file The File object to save.
 * @param subfolder The subfolder within 'public/uploads' to save the file to (e.g., 'comics/covers').
 * @param allowedFileTypes An array of allowed MIME types (e.g., ['image/jpeg', 'image/png']).
 * @param maxFileSizeBytes The maximum allowed file size in bytes.
 * @returns A promise that resolves to the public-relative path of the saved file (e.g., 'uploads/comics/covers/filename.png').
 * @throws An error if the file type or size is invalid.
 */
export async function saveFile(
  file: File,
  subfolder: string,
  allowedFileTypes: string[],
  maxFileSizeBytes: number
): Promise<string> {
  // Server-side validation
  if (!allowedFileTypes.includes(file.type)) {
    throw new Error("Invalid file type.");
  }
  if (file.size > maxFileSizeBytes) {
    throw new Error(`File size exceeds the limit of ${maxFileSizeBytes / 1024 / 1024}MB.`);
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${uniqueSuffix}${path.extname(file.name)}`;

  const uploadDir = path.join(process.cwd(), "public/uploads", subfolder);
  await fs.mkdir(uploadDir, { recursive: true });

  const savePath = path.join(uploadDir, filename);
  await fs.writeFile(savePath, fileBuffer);

  // Return the public-relative path to store in the database
  return path.join("uploads", subfolder, filename).replace(/\\/g, "/"); // Ensure forward slashes for web paths
}