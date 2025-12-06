"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Save, X, ImageIcon, Calendar, CheckCircle, Edit2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import api from "@/lib/apiClient";
import { PostDTO } from "@/types/api/posts";

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId;

  const [post, setPost] = useState<PostDTO | null>(null);
  const [editablePost, setEditablePost] = useState<Partial<PostDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!slug || !postId) return;

    async function fetchPost() {
      try {
        const data = await api.posts.get(slug, Number(postId));
        setPost(data.post);
        setEditablePost(data.post);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug, postId]);

  const handleSave = async () => {
    if (!slug || !postId || !editablePost) return;
    setLoading(true);
    try {
      // The API returns { ok: true }, not the updated post object.
      await api.posts.update(slug, Number(postId), {
        title: editablePost.title,
        description: editablePost.description,
        publishedAt: editablePost.publishedAt,
      });

      // Manually update local state since API doesn't return the full object
      setPost(prev => ({ ...prev!, ...editablePost }));
      setIsEditing(false);
      toast.success("Post updated!");
      router.refresh(); // Refresh server components on parent pages
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditablePost(post);
    setIsEditing(false);
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>;
  }

  if (!post || !editablePost) {
    return <div className="text-center text-red-500">Post not found.</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          {isEditing ? (
            <Input
              className="text-2xl font-bold"
              value={editablePost.title || ""}
              onChange={(e) => setEditablePost({ ...editablePost, title: e.target.value })}
            />
          ) : (
            <h2 className="text-2xl font-semibold">{post.title}</h2>
          )}
          <p className="text-sm text-gray-500">
            Created: {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
        {!isEditing && (
          <PublishStatusBadge publishedAt={post.publishedAt} />
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
          <label className="font-semibold">Description</label>
          {isEditing ? (
            <Textarea
              value={editablePost.description || ""}
              onChange={(e) => setEditablePost({ ...editablePost, description: e.target.value })}
            />
          ) : (
            <p className="text-gray-700">{post.description || "No description provided."}</p>
          )}
        </div>
        {isEditing && (
          <div className="space-y-2 rounded-lg border p-4">
            <label className="font-semibold">Publish Status</label>
            <div className="flex items-center space-x-2">
              <Switch
                id="publish-status"
                checked={!!editablePost.publishedAt}
                onCheckedChange={(checked) => {
                  setEditablePost({
                    ...editablePost,
                    publishedAt: checked ? new Date().toISOString() : null,
                  });
                }}
              />
              <Label htmlFor="publish-status">
                {editablePost.publishedAt ? "Published / Scheduled" : "Draft"}
              </Label>
            </div>
            {editablePost.publishedAt && (
              <div className="pt-2">
                <Label htmlFor="publish-date">Publish Date</Label>
                <Input
                  id="publish-date"
                  type="datetime-local"
                  value={formatDateForInput(editablePost.publishedAt)}
                  onChange={(e) =>
                    setEditablePost({
                      ...editablePost,
                      publishedAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateForInput(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 16);
}

function PublishStatusBadge({ publishedAt }: { publishedAt: string | null }) {
  const getStatus = () => {
    if (!publishedAt) return { text: "Draft", icon: <Edit2 size={12} />, className: "bg-gray-200 text-gray-700" };
    const publishDate = new Date(publishedAt);
    if (publishDate > new Date()) return { text: `Scheduled for ${publishDate.toLocaleDateString()}`, icon: <Calendar size={12} />, className: "bg-blue-100 text-blue-800" };
    return { text: "Published", icon: <CheckCircle size={12} />, className: "bg-green-100 text-green-800" };
  };
  const { text, icon, className } = getStatus();
  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${className}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
}
