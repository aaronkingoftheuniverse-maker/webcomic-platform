"use client";

import { useRouter } from "next/navigation";

export default function CreateProfilePrompt({ username }: { username: string }) {
  const router = useRouter();

  return (
    <div className="p-8 max-w-xl mx-auto text-center space-y-6">
      <h1 className="text-3xl font-bold">👋 Hey {username}!</h1>
      <p className="text-gray-600">
        You don't have a creator profile yet.  
        Create one to start posting your comics.
      </p>

      <button
        onClick={() => router.push("/profile/new")}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Create Creator Profile
      </button>
    </div>
  );
}
