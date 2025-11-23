"use client";

export default function FullCreatorDashboard({ session }: { session: any }) {
  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {session.user.username}! ✨
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Your Comics</h2>
        {/* TODO: Insert CreatorComicList */}
        <p className="text-gray-500">You can manage your comics here.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">New Post</h2>
        {/* TODO: Insert NewPostForm or similar */}
        <p className="text-gray-500">Create posts for your comic series.</p>
      </section>
    </div>
  );
}
