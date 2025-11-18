// /app/dashboard/admin/hooks/usePaginatedFetch.ts
import { useEffect, useState } from "react";

export function usePaginatedFetch<T>(baseUrl: string, deps: any[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Append page parameter safely
        const url = new URL(baseUrl, window.location.origin);
        url.searchParams.set("page", String(page));

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        const json = await res.json();

        // 🧩 Flexible response handling
        // Works for both:
        // { data: [], pagination: { totalPages: ... } }
        // and flatter: { logs: [], totalPages: ... }
        const newData =
          json.logs || json.data || (Array.isArray(json) ? json : []);
        const pages =
          json.totalPages ||
          json.pagination?.totalPages ||
          1;

        setData(newData);
        setTotalPages(pages);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [baseUrl, page, ...deps]);

  return {
    data,
    loading,
    page,
    totalPages,
    setPage,
    error,
    refetch: () => setPage((p) => p), // helper to refetch current page
  };
}
