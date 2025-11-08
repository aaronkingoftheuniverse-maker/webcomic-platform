'use client';
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main>
      {session ? (
        <p>Welcome, {session.user?.email}</p>
      ) : (
        <p>Not signed in</p>
      )}
    </main>
  );
}
