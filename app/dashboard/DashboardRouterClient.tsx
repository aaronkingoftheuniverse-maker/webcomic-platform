"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROLES } from "@/lib/roles";

export default function DashboardRouterClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/signin");
      return;
    }

    const role = session.user.role;

    switch (role) {
      case ROLES.ADMIN:
        router.push("/dashboard/admin");
        break;

      case ROLES.USER:
        router.push("/dashboard/creator");
        break;

      default:
        router.push("/unauthorized");
    }
  }, [session, status, router]);

  return (
    <div className="p-4 text-gray-500">
      {status === "loading" ? "Checking session..." : "Redirecting..."}
    </div>
  );
}
