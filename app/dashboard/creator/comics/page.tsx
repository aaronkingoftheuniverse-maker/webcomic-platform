"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ComicsListPage() {
  const [comics, setComics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/creator/comics")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.comics)) {
          setComics(data.comics);
        } else {
          console.error("Unexpected response:", data);
          setComics([]);
        }
      })
      .catch((err) => {
        console.error("Error loading comics:", err);
        setComics([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
      </div>
    );

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Comics</h2>
        <Link href="/dashboard/creator/comics/new">
          <Button>Create New Comic</Button>
        </Link>
      </div>

      {comics.length === 0 ? (
        <p className="text-gray-600">You haven’t created any comics yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {comics.map((comic) => (
            <li key={comic.id} className="py-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{comic.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {comic.description || "No description"}
                  </p>
                </div>
                <Link
                  href={`/dashboard/creator/comics/${comic.slug}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
