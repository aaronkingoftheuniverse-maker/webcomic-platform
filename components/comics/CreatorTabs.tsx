"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface CreatorTabsProps {
  username: string;
}

export function CreatorTabs({ username }: CreatorTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { name: "Comics", href: `/creators/${username}` },
    { name: "Merch", href: `/creators/${username}/merch` },
    { name: "Community", href: `/creators/${username}/community` },
  ];

  return (
    <nav className="border-b border-gray-300">
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
    </nav>
  );
}