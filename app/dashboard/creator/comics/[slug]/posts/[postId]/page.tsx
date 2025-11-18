export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/creator/posts/${postId}`,
    { cache: "no-store" }
  );

  const data = await res.json();
  if (!res.ok) notFound();

  const post = data.post; // FIXED

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{post.title}</h1>
      <p>{post.description}</p>

      <div className="space-y-2">
        {post.images.map((img: any) => (
          <img
            key={img.id}
            src={img.storagePath}
            alt={img.filename}
            className="w-full max-w-md"
          />
        ))}
      </div>
    </div>
  );
}
