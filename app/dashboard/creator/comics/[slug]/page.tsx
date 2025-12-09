"use client";

import { useEffect, useState, ChangeEvent, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageIcon, PlusCircle, Calendar, CheckCircle, Edit2, Save, X, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/apiClient";

import { ComicDetailDTO } from "@/types/api/comics"; // Import from types file
import { EpisodeDTO } from "@/types/api/episodes"; // Import from types file
import { PostDTO } from "@/types/api/posts"; // Import from types file

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Constructs the full URL for a stored image.
 * Prepends the base storage URL from environment variables.
 */
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

export default function ComicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [loading, setLoading] = useState(true);
  const [comic, setComic] = useState<ComicDetailDTO | null>(null);
  const [editableComic, setEditableComic] = useState<Partial<ComicDetailDTO> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const loadComicDetails = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const response = await api.comics.get(slug);
      setComic(response.comic);
      setEditableComic(response.comic);
      setCoverImagePreview(response.comic.coverImage ? getImageUrl(response.comic.coverImage) : null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to load comic details");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadComicDetails();
  }, [loadComicDetails]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return toast.error("Invalid file type. Please use JPG, PNG, or WEBP.");
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return toast.error(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
    }

    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setEditableComic(prev => ({ ...prev, coverImage: null }));
    const fileInput = document.getElementById('cover-image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSave = async () => {
    if (!slug || !editableComic) return;
    setLoading(true);
    try {
      const formData = new FormData();
      if (editableComic.title) formData.append("title", editableComic.title);
      if (editableComic.description) formData.append("description", editableComic.description);
      if (coverImageFile) formData.append("coverImage", coverImageFile);
      if (editableComic.coverImage === null && !coverImageFile) {
        formData.append("removeCoverImage", "true");
      }

      const updatedData = await api.comics.updateWithFormData(slug, formData);
      setComic(updatedData.comic);
      setEditableComic(updatedData.comic);
      setCoverImageFile(null);
      setIsEditing(false);
      toast.success("Comic updated successfully!");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save comic");
    } finally {
      setLoading(false);
    }
  }

  // Add a guard clause to ensure the slug is available before rendering.
  if (!slug) {
    return <div className="p-6 bg-white rounded-xl shadow-md max-w-xl">Loading comic details...</div>;
  }

  if (loading) {
    return <div className="p-6 bg-white rounded-xl shadow-md max-w-xl">Loading comic...</div>;
  }
  if (!comic) {
    return <div className="p-6 bg-white rounded-xl shadow-md max-w-xl text-red-500">Comic not found.</div>;
  }

  const handleCancel = () => {
    setEditableComic(comic);
    setCoverImagePreview(comic?.coverImage ? getImageUrl(comic.coverImage) : null);
    setIsEditing(false);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-4xl">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-grow space-y-2">
          {isEditing ? (
            <Input
              className="text-2xl font-bold"
              value={editableComic?.title || ""}
              onChange={(e) => setEditableComic({ ...editableComic, title: e.target.value })}
            />
          ) : (
            <h2 className="text-2xl font-semibold">{comic.title}</h2>
          )}
          {isEditing ? (
            <Textarea
              value={editableComic?.description || ""}
              onChange={(e) => setEditableComic({ ...editableComic, description: e.target.value })}
            />
          ) : (
            <p className="text-gray-700">{comic.description || "No description provided."}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          {isEditing ? (
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" disabled={loading}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button onClick={handleCancel} size="sm" variant="outline"><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} size="sm" variant="ghost"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="font-semibold">Cover Image</label>
          <div className="mt-2">
            {isEditing ? (
              <div className="w-40">
                {coverImagePreview ? (
                  <div className="relative">
                    <Image src={coverImagePreview} alt="Cover preview" width={160} height={160} className="object-cover rounded-md aspect-square" />
                    <Button variant="destructive" size="sm" className="mt-2 w-full" onClick={removeCoverImage}><Trash2 className="w-4 h-4 mr-2" /> Remove</Button>
                  </div>
                ) : (
                  <div className="w-40 h-40 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-500"><ImageIcon size={32} /><p className="mt-2 text-xs">Add Cover</p></div>
                )}
                <Input id="cover-image-input" type="file" className="mt-2" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(",")} />
              </div>
            ) : (
              coverImagePreview ? <Image src={coverImagePreview} alt="Comic cover" width={160} height={160} className="object-cover rounded-md" /> : <p className="text-gray-500 italic">No cover image.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 mb-6">
        <Button onClick={() => router.push(`/dashboard/creator/comics/${slug}/episodes/new`)}>
          + New Episode
        </Button>
      </div>

      <h3 className="text-xl font-semibold mb-3 border-b pb-2">Content Structure</h3>

      <TooltipProvider>
        {comic.episodes.length === 0 ? (
          <p className="text-gray-500 italic">No episodes yet.</p>
        ) : (
          <div className="space-y-1">
            {comic.episodes.map((episode) => (
              <EpisodeItem key={episode.id} episode={episode} comicSlug={slug} level={0} />
            ))}
          </div>
        )}
      </TooltipProvider>
    </div>
  );
}

// Reusable component for rendering an Episode and its children
function EpisodeItem({ episode, comicSlug, level }: { episode: EpisodeDTO; comicSlug: string; level: number }) {
  const router = useRouter();
  const indentation = { paddingLeft: `${level * 2}rem` };

  return (
    <div>
      <div style={indentation} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-100">
        <ItemThumbnail src={getImageUrl(episode.thumbnailUrl)} alt={episode.title} />
        <span className="font-semibold flex-grow">{episode.title}</span>
        <PublishStatusBadge publishedAt={episode.publishedAt} />
        <div className="flex items-center gap-3 text-xs">
          <Link href={`/dashboard/creator/comics/${comicSlug}/posts/new?episodeId=${episode.id}`} className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
            <PlusCircle size={14} /> Post
          </Link>
          <Link href={`/dashboard/creator/comics/${comicSlug}/episodes/new?parentId=${episode.id}`} className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
            <PlusCircle size={14} /> Episode
          </Link>
          <Link href={`/dashboard/creator/comics/${comicSlug}/episodes/${episode.id}`} className="text-blue-600 hover:underline">
            edit
          </Link>
        </div>
      </div>
      <div className="space-y-1">
        {episode.posts.map(post => (
          <PostItem key={post.id} post={post} comicSlug={comicSlug} level={level + 1} />
        ))}
        {(episode.childEpisodes || []).map(child => (
          <EpisodeItem key={child.id} episode={child} comicSlug={comicSlug} level={level + 1} />
        ))}
      </div>
    </div>
  );
}

// Reusable component for rendering a Post
function PostItem({ post, comicSlug, level }: { post: PostDTO; comicSlug: string; level: number }) {
  const indentation = { paddingLeft: `${level * 2}rem` };

  return (
    <div style={indentation} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-100">
      <ItemThumbnail src={getImageUrl(post.thumbnailImage?.filename)} alt={post.title} />
      <span className="flex-grow">{post.title}</span>
      <PublishStatusBadge publishedAt={post.publishedAt} />
      <div className="flex items-center gap-3 text-xs">
        <Link href={`/dashboard/creator/comics/${comicSlug}/posts/${post.id}`} className="text-blue-600 hover:underline">
          edit
        </Link>
      </div>
    </div>
  );
}

// Reusable component for the small thumbnail with a tooltip
function ItemThumbnail({ src, alt }: { src: string | null; alt: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={24}
            height={24}
            className="object-cover rounded-sm w-6 h-6 bg-gray-200"
          />
        ) : (
          <div className="w-6 h-6 bg-gray-200 rounded-sm flex items-center justify-center text-gray-400">
            <ImageIcon size={14} />
          </div>
        )}
      </TooltipTrigger>
      <TooltipContent>
        {src ? (
          <Image src={src} alt={alt} width={150} height={150} className="object-cover rounded-md" />
        ) : (
          <p>No thumbnail</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// New component to display the publishing status
function PublishStatusBadge({ publishedAt }: { publishedAt: string | null }) {
  const getStatus = () => {
    if (!publishedAt) {
      return {
        text: "Draft",
        icon: <Edit2 size={12} />,
        className: "bg-gray-200 text-gray-700",
      };
    }
    const publishDate = new Date(publishedAt);
    const now = new Date();

    if (publishDate > now) {
      return {
        text: `Scheduled: ${publishDate.toLocaleDateString()}`,
        icon: <Calendar size={12} />,
        className: "bg-blue-100 text-blue-800",
      };
    }

    return {
      text: "Published",
      icon: <CheckCircle size={12} />,
      className: "bg-green-100 text-green-800",
    };
  };

  const { text, icon, className } = getStatus();

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${className}`}
        >
          {icon}
          <span className="hidden sm:inline">{text.split(":")[0]}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
