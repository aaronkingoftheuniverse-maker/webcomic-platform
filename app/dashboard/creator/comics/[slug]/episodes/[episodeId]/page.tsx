"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Save, X, ImageIcon } from "lucide-react";
import api from "@/lib/apiClient";

interface PostDTO {
  id: number;
  title: string;
  description?: string | null;
  thumbnailImage?: { filename: string } | null;
}

interface ChildEpisodeDTO {
  id: number;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  posts: PostDTO[];
}

interface EpisodeDetailDTO {
  id: number;
  title: string;
  description: string | null;
  episodeNumber: number;
  createdAt: string;
  posts: PostDTO[];
  childEpisodes: ChildEpisodeDTO[];
}

export default function EpisodeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const episodeId = Array.isArray(params.episodeId) ? params.episodeId[0] : params.episodeId;

  const [episode, setEpisode] = useState<EpisodeDetailDTO | null>(null);
  const [editableEpisode, setEditableEpisode] = useState<Partial<EpisodeDetailDTO>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!slug || !episodeId) return;

    async function fetchEpisode() {
      try {
        const data = await api.episodes.get(slug, Number(episodeId));
        setEpisode(data.episode);
        setEditableEpisode(data.episode);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEpisode();
  }, [slug, episodeId]);

  const handleSave = async () => {
    if (!slug || !episodeId) return;
    setLoading(true);
    try {
      const updatedData = await api.episodes.update(slug, Number(episodeId), {
        title: editableEpisode.title,
        description: editableEpisode.description,
        episodeNumber: Number(editableEpisode.episodeNumber),
      });

      setEpisode(prev => ({...prev, ...updatedData.episode}));
      setEditableEpisode(updatedData.episode);
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
    setEditableEpisode(episode!);
    setIsEditing(false);
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>;
  }

  if (!episode) {
    return <div className="text-center text-red-500">Episode not found.</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-4xl mx-auto space-y-6">
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
            Created on: {new Date(episode.createdAt).toLocaleDateString()}
          </p>
        </div>
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

function getImageUrl(relativePath: string | null): string | null {
  if (!relativePath) return null;
  return `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}${relativePath}`;
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