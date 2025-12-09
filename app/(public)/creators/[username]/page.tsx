import { getCreatorPageData } from "@/lib/data/creators";
import { ComicCard } from "@/components/comics/ComicCard";

interface CreatorComicsPageProps {
  params: { username: string };
}

export default async function CreatorComicsPage({
  params: paramsProp,
}: CreatorComicsPageProps) {
  const params = await paramsProp;
  const creator = await getCreatorPageData(params.username);

  return (
    <div>
      {creator.comics.length === 0 ? (
        <p className="text-gray-600 italic py-8 text-center">
          This creator hasn’t published any comics yet.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {creator.comics.map((comic) => (
            <ComicCard
              key={comic.id}
              comic={comic}
              linkHref={`/comics/${comic.slug}`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}