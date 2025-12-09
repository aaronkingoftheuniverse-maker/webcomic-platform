import Image from "next/image";
import Link from "next/link";
import { Globe, UserCircle } from "lucide-react";

interface CreatorInfoCardProps {
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  website: string | null;
}

function getImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;

  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;

  // If the base URL isn't set, just return the relative path.
  // This works for local development where files are in /public.
  if (!baseUrl) {
    return relativePath;
  }

  // If baseUrl is a full URL, use the robust URL constructor.
  if (baseUrl.startsWith("http")) {
    return new URL(relativePath, baseUrl).href;
  }

  // Otherwise, handle as a relative path, preventing double slashes.
  return `${baseUrl.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
}

export function CreatorInfoCard({
  username,
  avatarUrl,
  bio,
  website,
}: CreatorInfoCardProps) {
  const imageUrl = getImageUrl(avatarUrl);

  return (
    <aside className="p-4 bg-gray-100/80 rounded-lg border border-gray-200/80 space-y-4">
      <div className="flex flex-col items-center">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Avatar for ${username}`}
            width={128}
            height={128}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
          />
        ) : (
          <UserCircle className="w-32 h-32 text-gray-400" />
        )}
        <h2 className="mt-3 text-xl font-bold">{username}</h2>
      </div>
      {bio && <p className="text-sm text-gray-700 text-center">{bio}</p>}
      {website && (
        <Link href={website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline">
          <Globe size={16} />
          <span>Visit Website</span>
        </Link>
      )}
    </aside>
  );
}