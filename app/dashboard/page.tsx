"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRouter() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/signin");
      return;
    }

    const role = session.user.role;

    switch (role) {
      case "ADMIN":
        router.push("/dashboard/admin");
        break;
      case "CREATOR":
        router.push("/dashboard/creator");
        break;
      case "PRO_CREATOR":
        router.push("/dashboard/pro");
        break;
      default:
        router.push("/unauthorized");
    }
  }, [session, status, router]);

  return <div className="p-4 text-gray-500">Redirecting to your dashboard...</div>;
}
