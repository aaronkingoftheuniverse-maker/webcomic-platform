export default async function PostsPage({ params }: { params: { comicId: string } }) {
  const comicId = params.comicId;

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/creator/posts?comicId=${comicId}`, {
    cache: "no-store",
  });

  const data = await res.json();
  const posts = data.posts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Posts</h1>
        <Link
          className="bg-blue-600 text-white px-3 py-2 rounded"
          href={`/dashboard/creator/comics/${comicId}/posts/new`}
        >
          New Post
        </Link>
      </div>

      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              className="block border p-3 rounded hover:bg-gray-50"
              href={`/dashboard/creator/comics/${comicId}/posts/${post.id}`}
            >
              #{post.postNumber} — {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
