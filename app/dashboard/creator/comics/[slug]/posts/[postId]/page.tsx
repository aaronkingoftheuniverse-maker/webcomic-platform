// dashboard/creator/comics/[slug]/posts/[postId]/page.tsx
import { notFound } from "next/navigation";
import api from "@/lib/apiClient";

export default async function PostDetailPage({ params }: { params: { slug: string; postId: string } }) {
  const { slug, postId } = params;

  let post;
  try {
    post = await api.posts.get(slug, Number(postId)); // <- API returns raw post object
  } catch {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{post.title}</h1>
      <p>{post.description}</p>

      <div className="space-y-2">
        {(post.images ?? []).map((img: any) => (
          <img key={img.id} src={img.storagePath} alt={img.filename} className="w-full max-w-md" />
        ))}
      </div>
    </div>
  );
}
