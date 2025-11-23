import Link from "next/link";
import api from "@/lib/apiClient";

export default async function PostsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  let posts = [];

  try {
    const res = await api.posts.list(slug); // <- DRY [slug]/posts
    posts = res.posts ?? [];
  } catch (err) {
    console.error(err);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Posts</h1>
        <Link
          className="bg-blue-600 text-white px-3 py-2 rounded"
          href={`/dashboard/creator/comics/${slug}/posts/new`}
        >
          New Post
        </Link>
      </div>

      <ul className="space-y-3">
        {posts.map((post: any) => (
          <li key={post.id}>
            <Link
              className="block border p-3 rounded hover:bg-gray-50"
              href={`/dashboard/creator/comics/${slug}/posts/${post.id}`}
            >
              #{post.postNumber} — {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
