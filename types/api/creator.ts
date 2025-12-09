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

// ==========================================
// Subscription Management Types
// ==========================================

/**
 * Represents a comic the user is subscribed to.
 */
export interface SubscribedComicDTO {
  id: number;
  title: string;
  slug: string;
  coverImage: string | null;
  creatorProfile: {
    user: {
      username: string;
    };
  };
}

/**
 * Represents a user who has subscribed to a comic or a creator profile.
 */
export interface SubscriberDTO {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface CreatorComicWithSubscribersDTO {
  id: number;
  title: string;
  slug: string;
  subscribers: SubscriberDTO[];
}

// This type is now an alias for SubscriberDTO for clarity in usage.
export type CreatorProfileSubscriberDTO = SubscriberDTO;