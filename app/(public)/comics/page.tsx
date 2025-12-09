import { prisma } from "@/config/prisma";
import { mapComicToDTO } from "@/lib/dtoMappers";
import { ComicCard } from "@/components/comics/ComicCard";

async function getAllComics() {
  const comics = await prisma.comic.findMany({
    where: {
      episodes: {
        some: { posts: { some: { publishedAt: { lte: new Date() } } } },
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      _count: { select: { episodes: true } },
      episodes: { select: { _count: { select: { posts: true } } } },
    },
    orderBy: { title: "asc" },
  });

  return comics.map((comic) => mapComicToDTO({ ...comic, lastPostedAt: null }));
}

export default async function ComicsIndexPage() {
  const comics = await getAllComics();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 border-b pb-4">All Comics</h1>
      <ul className="divide-y divide-gray-200">
        {comics.map((comic) => (
          <ComicCard key={comic.id} comic={comic} linkHref={`/comics/${comic.slug}`} />
        ))}
      </ul>
    </div>
  );
}