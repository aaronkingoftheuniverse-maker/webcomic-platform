// This file defines the TypeScript types for the Creator Profile API endpoints.

/**
 * Represents the full CreatorProfile object, consistent with the Prisma model
 * and the data returned by the GET /api/creator/profile endpoint.
 */
export interface CreatorProfile {
  id: number;
  userId: number;
  bio: string | null;
  website: string | null;
  avatarUrl: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  _count?: {
    subscribers: number;
  };
}

/**
 * Represents the payload for creating or updating a CreatorProfile.
 * It only includes the fields that are user-editable.
 */
export type UpdateCreatorProfilePayload = Partial<Pick<CreatorProfile, "bio" | "website" | "avatarUrl">>;