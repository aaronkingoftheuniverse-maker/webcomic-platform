"use client";
import { useSession } from "next-auth/react";

export default function SessionDebug() {
  const { data: session } = useSession();
  return (
    <pre className="p-4 bg-gray-100 rounded text-sm">
      {JSON.stringify(session, null, 2)}
    </pre>
  );
}
