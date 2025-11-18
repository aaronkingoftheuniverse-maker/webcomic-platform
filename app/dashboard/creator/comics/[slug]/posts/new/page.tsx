import NewPostForm from "@/components/dashboard/posts/NewPostForm";

export default function NewPostPage({ params }: { params: { comicId: string } }) {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Create New Post</h1>
      <NewPostForm comicId={Number(params.comicId)} />
    </div>
  );
}
