import Link from "next/link";
import { ComicCard, ComicCardData } from "@/components/comics/ComicCard";
import { getHomePageData } from "@/lib/data/homepage"; // Import the new server function

export default async function HomePage() {
  // Fetch data directly on the server. No API call needed.
  const data = await getHomePageData();

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="space-y-12">
        <ComicSection
          title="Recently Updated"
          comics={data.recentlyUpdated}
        />
        <ComicSection title="Newly Added" comics={data.newlyAdded} />
        {/* You can easily add more sections here as your API evolves */}
      </div>
    </main>
  );
}

// A reusable component to render a section of comics
function ComicSection({
  title,
  comics,
}: {
  title: string;
  comics: ComicCardData[];
}) {
  return (
    <section>
      <h2 className="text-2xl font-bold border-b pb-2 mb-4">{title}</h2>
      {comics.length === 0 ? (
        <p className="text-gray-500">No comics to display in this section.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comics.map((comic) => (
            <ComicCard key={comic.id} comic={comic} linkHref={`/comics/${comic.slug}`} />
          ))}
        </ul>
      )}
    </section>
  );
}
