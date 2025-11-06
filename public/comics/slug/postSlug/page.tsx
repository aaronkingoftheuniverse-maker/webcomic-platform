export default function ComicPostPage({ params }: { params: { slug: string; postSlug: string } }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Episode: {params.postSlug}</h1>
      <p>Display comic images and navigation here.</p>
    </main>
  );
}
