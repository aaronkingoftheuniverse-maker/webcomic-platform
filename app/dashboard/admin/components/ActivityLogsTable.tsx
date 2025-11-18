// /app/dashboard/admin/components/ActivityLogsTable.tsx
"use client";

import { useState } from "react";
import { usePaginatedFetch } from "../hooks/usePaginatedFetch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function ActivityLogsTable() {
  const [failedOnly, setFailedOnly] = useState(false);
const { data: logs, loading, page, totalPages, setPage } =
  usePaginatedFetch<any>(`/api/admin/activity-logs?failedOnly=${failedOnly}`, [failedOnly]);


  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">API Activity Logs</h2>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={failedOnly}
            onChange={(e) => setFailedOnly(e.target.checked)}
          />
          <span className="text-sm">Show Failed Only</span>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                <TableCell>{log.user?.username || `User #${log.userId || "?"}`}</TableCell>
                <TableCell className="truncate max-w-xs">{log.endpoint}</TableCell>
                <TableCell>{log.ipAddress}</TableCell>
                <TableCell>
                  <Badge className="bg-blue-100 text-blue-700">{log.method}</Badge>
                </TableCell>
                <TableCell>
                  {log.success ? (
                    <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Success
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                      <XCircle size={14} /> Failed
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      <div className="flex justify-end mt-4 space-x-2">
        <button
          className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
        <button
          className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
