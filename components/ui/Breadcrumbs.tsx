"use client";

import Link from "next/link";
import { Fragment } from "react";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-gray-600">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
            )}
            <li>
              {item.href && index < items.length - 1 ? (
                <Link href={item.href} className="hover:underline hover:text-gray-900 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-gray-800">{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

