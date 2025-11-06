export default function ComicPage({ params }: { params: { slug: string } }) {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold mb-2">Comic: {params.slug}</h1>
      <p>This page will show comic details and post list.</p>
    </main>
  );
}
