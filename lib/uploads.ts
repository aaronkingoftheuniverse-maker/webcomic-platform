import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Validates and saves an uploaded file to a specified subfolder.
 * This is the core internal function.
 * @returns The public-relative path of the saved file.
 * @throws An error if validation fails.
 */
async function saveFile(file: File, subfolder: string): Promise<string> {
  // Server-side validation
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error("Invalid file type.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`);
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const uniqueSuffix = `${Date.now()}-${uuidv4().slice(0, 8)}`;
  const filename = `${uniqueSuffix}${path.extname(file.name)}`;

  const uploadDir = path.join(UPLOAD_DIR, subfolder);
  await fs.mkdir(uploadDir, { recursive: true });

  const savePath = path.join(uploadDir, filename);
  await fs.writeFile(savePath, fileBuffer);

  // Return the public-relative path to store in the database
  return path.join("/uploads", subfolder, filename).replace(/\\/g, "/");
}

/**
 * A safe wrapper for handling file uploads in API routes.
 * Catches errors and returns a standardized response object.
 * @returns A success or error object.
 */
export async function handleFileUpload(
  file: File,
  subfolder: string
): Promise<{ success: true; filePath: string } | { success: false; error: string }> {
  try {
    const filePath = await saveFile(file, subfolder);
    return { success: true, filePath };
  } catch (error: any) {
    console.error("File upload failed:", error);
    return { success: false, error: error.message || "File upload failed" };
  }
}

/**
 * Deletes a file from the public/uploads directory.
 * @param filePath The public-relative path of the file to delete (e.g., '/uploads/subfolder/file.png').
 */
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Basic security: ensure we're only deleting files within the uploads directory
    if (!filePath || !filePath.startsWith("/uploads/")) {
      console.warn(`Attempted to delete file outside of uploads directory: ${filePath}`);
      return { success: true }; // Fail silently
    }

    const fullPath = path.join(process.cwd(), "public", filePath);
    await fs.unlink(fullPath);
    return { success: true };
  } catch (error: any) {
    // If the error is that the file doesn't exist, that's okay.
    if (error.code === 'ENOENT') {
      return { success: true };
    }
    console.error(`File deletion failed for path: ${filePath}`, error);
    return { success: false, error: error.message || "File deletion failed" };
  }
}