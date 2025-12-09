"use client";

import { useEffect, useState, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Save, X, ImageIcon, Calendar, CheckCircle, Edit2, Trash2, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import api from "@/lib/apiClient";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { EpisodeDTO as EpisodeDetailDTO } from "@/types/api/episodes";
import { PostDTO } from "@/types/api/posts";

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Constructs the full URL for a stored image.
 * This robust version handles various base URL formats.
 */
function getImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;
  if (!baseUrl) return relativePath; // Assume local path if no base URL
  if (baseUrl.startsWith("http")) return new URL(relativePath, baseUrl).href;
  return `${baseUrl.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
}

export default function EpisodeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const episodeId = Array.isArray(params.episodeId) ? params.episodeId[0] : params.episodeId;
  const [episode, setEpisode] = useState<EpisodeDetailDTO | null>(null);
  const [editableEpisode, setEditableEpisode] = useState<Partial<EpisodeDetailDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !episodeId) return;

    async function fetchEpisode() {
      try {
        const data = await api.episodes.get(slug, Number(episodeId));
        setBreadcrumbs(data.breadcrumbs);
        setEpisode(data.episode);
        setEditableEpisode(data.episode);
        setThumbnailPreview(data.episode.thumbnailUrl ? getImageUrl(data.episode.thumbnailUrl) : null);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEpisode();
  }, [slug, episodeId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return toast.error("Invalid file type. Please use JPG, PNG, or WEBP.");
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return toast.error(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setEditableEpisode(prev => ({ ...prev, thumbnailUrl: null })); // Explicitly set to null for API
    const fileInput = document.getElementById('thumbnail-input') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSave = async () => {
    if (!slug || !episodeId) return;
    if (!editableEpisode) return;
    setLoading(true);
    try {
      let updatedData;
      if (thumbnailFile || editableEpisode.thumbnailUrl === null) {
        // If a new file is selected or thumbnail is explicitly removed, use FormData
        const formData = new FormData();
        if (editableEpisode.title) formData.append("title", editableEpisode.title);
        if (editableEpisode.description) formData.append("description", editableEpisode.description);
        if (editableEpisode.episodeNumber) formData.append("episodeNumber", String(editableEpisode.episodeNumber));
        if (editableEpisode.publishedAt) formData.append("publishedAt", editableEpisode.publishedAt);
        if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
        if (editableEpisode.thumbnailUrl === null && !thumbnailFile) {
          formData.append("removeThumbnail", "true"); // Signal to API to remove thumbnail
        }
        updatedData = await api.episodes.updateWithFormData(slug, Number(episodeId), formData);
      } else {
        // Otherwise, send JSON for text-based updates
        updatedData = await api.episodes.update(slug, Number(episodeId), {
          title: editableEpisode.title,
          description: editableEpisode.description,
          episodeNumber: Number(editableEpisode.episodeNumber),
          publishedAt: editableEpisode.publishedAt,
        });
      }

      setEpisode(prev => ({ ...prev!, ...updatedData.episode }));
      setEditableEpisode(updatedData.episode);
      setThumbnailFile(null); // Clear file input after successful upload
      setIsEditing(false);
      toast.success("Episode updated!");
      router.refresh(); // Refresh server components on parent pages
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditableEpisode(episode);
    setThumbnailPreview(episode?.thumbnailUrl ? getImageUrl(episode.thumbnailUrl) : null);
    setIsEditing(false);
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>;
  }

  if (!episode || !editableEpisode) {
    return <div className="text-center text-red-500">Episode not found.</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-4xl mx-auto space-y-6">
      <Breadcrumbs items={breadcrumbs} />
      <div className="flex justify-between items-start">
        <div>
          {isEditing ? (
            <Input
              className="text-2xl font-bold"
              value={editableEpisode.title || ""}
              onChange={(e) => setEditableEpisode({ ...editableEpisode, title: e.target.value })}
            />
          ) : (
            <h2 className="text-2xl font-semibold">{episode.title}</h2>
          )}
          <p className="text-sm text-gray-500">
            Created: {new Date(episode.createdAt).toLocaleDateString()}
          </p>
        </div>
        {!isEditing && (
          <PublishStatusBadge publishedAt={episode.publishedAt} />
        )}
        {isEditing ? (
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" disabled={loading}><Save className="mr-2 h-4 w-4" /> Save</Button>
            <Button onClick={handleCancel} size="sm" variant="outline"><X className="mr-2 h-4 w-4" /> Cancel</Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)} size="sm" variant="ghost"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="font-semibold">Episode Number</label>
          {isEditing ? (
            <Input
              type="number"
              value={editableEpisode.episodeNumber || ""}
              onChange={(e) => setEditableEpisode({ ...editableEpisode, episodeNumber: Number(e.target.value) })}
            />
          ) : (
            <p className="text-gray-700">{episode.episodeNumber}</p>
          )}
        </div>
        <div>
          <label className="font-semibold">Description</label>
          {isEditing ? (
            <Textarea
              value={editableEpisode.description || ""}
              onChange={(e) => setEditableEpisode({ ...editableEpisode, description: e.target.value })}
            />
          ) : (
            <p className="text-gray-700">{episode.description || "No description provided."}</p>
          )}
        </div>

        {/* Thumbnail Section - Now visible in both view and edit modes */}
        <div>
          <label className="font-semibold">Thumbnail</label>
          <div className="mt-2">
            {isEditing ? (
              // EDITING UI for Thumbnail
              <div className="self-start">
                {thumbnailPreview ? (
                  <div className="w-40">
                    <Image
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      width={160}
                      height={160}
                      className="object-cover rounded-md aspect-square"
                    />
                    <Button variant="destructive" size="sm" className="mt-2 w-full" onClick={removeThumbnail}>
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="w-40 h-40 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon size={32} /><p className="mt-2 text-xs">Add Thumbnail</p>
                  </div>
                )}
                <Input id="thumbnail-input" type="file" className="mt-2" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(",")} />
              </div>
            ) : (
              // VIEW-ONLY UI for Thumbnail
              thumbnailPreview ? (
                <Image src={thumbnailPreview} alt="Episode thumbnail" width={160} height={160} className="object-cover rounded-md" />
              ) : (
                <p className="text-gray-500 italic">No thumbnail set.</p>
              )
            )}
          </div>
        </div>

        {isEditing && (
          <div className="space-y-2 rounded-lg border p-4">
            <label className="font-semibold">Publish Status</label>
            <div className="flex items-center space-x-2">
              <Switch
                id="publish-status"
                checked={!!editableEpisode.publishedAt}
                onCheckedChange={(checked) => {
                  setEditableEpisode({
                    ...editableEpisode,
                    publishedAt: checked ? new Date().toISOString() : null,
                  });
                }}
              />
              <Label htmlFor="publish-status">
                {editableEpisode.publishedAt ? "Published / Scheduled" : "Draft"}
              </Label>
            </div>
            {editableEpisode.publishedAt && (
              <div className="pt-2">
                <Label htmlFor="publish-date">Publish Date</Label>
                <Input
                  id="publish-date"
                  type="datetime-local"
                  value={formatDateForInput(editableEpisode.publishedAt)}
                  onChange={(e) =>
                    setEditableEpisode({
                      ...editableEpisode,
                      publishedAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-6 space-y-4">
        <h3 className="text-lg font-semibold">Content</h3>
        <div className="pl-4 space-y-3">
          {/* Render Posts */}
          {episode.posts.map(post => (
            <PostItem key={post.id} post={post} comicSlug={slug} />
          ))}

          {/* Render Child Episodes */}
          {episode.childEpisodes.map(child => (
            <div key={child.id} className="p-3 border rounded-lg bg-gray-50/50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getImageUrl(child.thumbnailUrl) ? (
                    <Image src={getImageUrl(child.thumbnailUrl)!} alt={`Thumbnail for ${child.title}`} width={48} height={48} className="object-cover rounded-md w-12 h-12" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400"><ImageIcon size={20} /></div>
                  )}
                </div>
                <div className="flex-grow">
                  <Link href={`/dashboard/creator/comics/${slug}/episodes/${child.id}`}>
                    <h5 className="font-semibold hover:underline text-blue-700">{child.title}</h5>
                  </Link>
                  {child.description && <p className="text-sm text-gray-600">{child.description}</p>}
                </div>
              </div>
              <div className="pl-4 mt-2 space-y-2 border-l-2 ml-6">
                {child.posts.map(post => (
                  <PostItem key={post.id} post={post} comicSlug={slug} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Actions</h3>
        <div className="flex gap-4">
          <Button onClick={() => router.push(`/dashboard/creator/comics/${slug}/posts/new?episodeId=${episode.id}`)}>
            + New Post
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/creator/comics/${slug}/episodes/new?parentId=${episode.id}`)}>
            + New Sub-Episode
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Formats an ISO date string into a `YYYY-MM-DDTHH:mm` string
 * suitable for a datetime-local input.
 */
function formatDateForInput(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  // Adjust for timezone offset to display local time correctly in the input
  const timezoneOffset = date.getTimezoneOffset() * 60000; // in milliseconds
  const localDate = new Date(date.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 16);
}

function PostItem({ post, comicSlug }: { post: PostDTO; comicSlug: string }) {
  const router = useRouter();
  return (
    <div
      key={post.id}
      className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
      onClick={() => router.push(`/dashboard/creator/comics/${comicSlug}/posts/${post.id}`)}
    >
      <div className="flex-shrink-0">
        {getImageUrl(post.thumbnailImage?.filename) ? (
          <Image src={getImageUrl(post.thumbnailImage.filename)!} alt={`Thumbnail for ${post.title}`} width={40} height={40} className="object-cover rounded w-10 h-10" />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400"><ImageIcon size={16} /></div>
        )}
      </div>
      <div>
        <p className="font-medium text-sm">{post.title}</p>
        {post.description && <p className="text-xs text-gray-500 truncate">{post.description}</p>}
      </div>
    </div>
  );
}

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
        text: `Scheduled for ${publishDate.toLocaleDateString()}`,
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
    <div className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${className}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
}