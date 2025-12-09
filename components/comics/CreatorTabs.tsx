"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserCircle } from "lucide-react";

interface CreatorTabsProps {
  username: string;
  avatarUrl: string | null;
}

function getImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;
  if (!baseUrl) {
    return relativePath;
  }
  if (baseUrl.startsWith("http")) {
    return new URL(relativePath, baseUrl).href;
  }
  return `${baseUrl.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
}

export function CreatorTabs({ username, avatarUrl }: CreatorTabsProps) {
  const pathname = usePathname();
  const imageUrl = getImageUrl(avatarUrl);

  const tabs = [
    { name: "Comics", href: `/creators/${username}` },
    { name: "Merch", href: `/creators/${username}/merch` },
    { name: "Community", href: `/creators/${username}/community` },
  ];

  return (
    <nav>
      <div className="flex items-center gap-4 mb-4">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Avatar for ${username}`}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <UserCircle className="w-12 h-12 text-gray-400" />
        )}
        <h1 className="text-3xl font-bold">{username}</h1>
      </div>
      <div className="border-b border-gray-300">
        <ul className="flex items-center gap-8 -mb-px">
        {tabs.map((tab) => {
          // The default creator page is the base href, so we need an exact match.
          const isActive = tab.href === `/creators/${username}`
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <li key={tab.name}>
              <Link href={tab.href} className={`block py-3 px-1 text-lg font-semibold border-b-4 transition-colors ${isActive ? 'border-blue-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400'}`}>
                {tab.name}
              </Link>
            </li>
          );
        })}
        </ul>
      </div>
    </nav>
  );
}