import Image from "next/image";
import Link from "next/link";

interface PostImageData {
  id: number;
  filename: string;
  storagePath: string | null;
}

interface PostViewerProps {
  title: string;
  images: PostImageData[];
  // Pass the full hrefs for simpler logic
  nextPostHref: string | null;
  prevPostHref: string | null;
  activePostSlug?: string; // Optional prop to receive the active slug
}

function getImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;
  if (!baseUrl) {
    return relativePath;
  }
  if (baseUrl.startsWith("http")) {
    return new URL(relativePath, baseUrl).href;
  }
  // Otherwise, handle as a relative path, preventing double slashes.
  return `${baseUrl.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
}

export function PostViewer({ title, images, nextPostHref, prevPostHref }: PostViewerProps) {
  return (
    <article className="w-full max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">{title}</h1>

      <div className="space-y-2">
        {images.map((image) => (
          <div key={image.id} className="relative w-full">
            <Image
              src={getImageUrl(image.storagePath || image.filename)!}
              alt={`Page ${image.id} of ${title}`}
              width={800}
              height={1200}
              className="w-full h-auto"
              priority={images.indexOf(image) < 2} // Prioritize loading the first couple of images
            />
          </div>
        ))}
      </div>

      <nav className="flex justify-between mt-12 text-lg font-semibold">
        {prevPostHref ? <Link href={prevPostHref} className="hover:underline">{"< Previous"}</Link> : <span />}
        {nextPostHref ? <Link href={nextPostHref} className="hover:underline">{"Next >"}</Link> : <span />}
      </nav>
    </article>
  );
}