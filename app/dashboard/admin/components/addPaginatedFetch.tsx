// /app/dashboard/admin/hooks/usePaginatedFetch.ts
import { useEffect, useState } from "react";

export function usePaginatedFetch<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`${url}?page=${page}`);
        const json = await res.json();
        setData(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [url, page, ...deps]);

  return { data, loading, page, totalPages, setPage };
}
