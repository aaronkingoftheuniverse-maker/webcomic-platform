"use client";

import { useEffect, useState, ChangeEvent, useCallback } from "react";
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
import { PostDTO, ImageDTO } from "@/types/api/posts";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Constructs the full URL for a stored image.
 */
function getImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;
  if (!baseUrl) return relativePath;
  if (baseUrl.startsWith("http")) return new URL(relativePath, baseUrl).href;
  return `${baseUrl.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId;

  const [post, setPost] = useState<PostDTO | null>(null);
  const [editablePost, setEditablePost] = useState<Partial<PostDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // State for image management
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);

  const fetchPost = useCallback(async () => {
    if (!slug || !postId) return;
    try {
      const data = await api.posts.get(slug, Number(postId));
      setPost(data.post);
      setEditablePost(data.post);
      setBreadcrumbs(data.breadcrumbs);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [slug, postId]); // Dependencies for the callback

  useEffect(() => {
    // Initial fetch on component mount
    fetchPost();
  }, [fetchPost]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File is too large: ${file.name}`);
        return false;
      }
      return true;
    });
    setNewImageFiles(prev => [...prev, ...validFiles]);
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const markImageForDeletion = (imageId: number) => {
    setImagesToDelete(prev => [...prev, imageId]);
    setEditablePost(prev => ({
      ...prev,
      images: prev?.images?.filter(img => img.id !== imageId) || [],
      thumbnailImage: prev?.thumbnailImage?.id === imageId ? null : prev?.thumbnailImage,
    }));
  };

  const setAsThumbnail = (image: ImageDTO) => {
    setEditablePost(prev => ({ ...prev, thumbnailImage: image }));
  };

  const handleSave = async () => {
    if (!slug || !postId || !editablePost) return;
    setLoading(true);
    try {
      const formData = new FormData();
      if (editablePost.title) formData.append("title", editablePost.title);
      if (editablePost.description) formData.append("description", editablePost.description);
      if (editablePost.publishedAt) formData.append("publishedAt", editablePost.publishedAt);
      formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
      formData.append("thumbnailImageId", editablePost.thumbnailImage?.id?.toString() ?? 'null');
      newImageFiles.forEach((file, index) => formData.append(`images[${index}]`, file));

      await api.posts.updateWithFormData(slug, Number(postId), formData);

      setIsEditing(false);
      toast.success("Post updated!");
      // Refetch data to get the latest state
      await fetchPost();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditablePost(post);
    setNewImageFiles([]);
    setImagesToDelete([]);
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
      <Breadcrumbs items={breadcrumbs} />
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

        {/* === THUMBNAIL SECTION === */}
        <div className="space-y-2">
          <h3 className="font-semibold">Thumbnail</h3>
          {editablePost.thumbnailImage ? (
            <div className="relative w-40">
              <Image
                src={getImageUrl(editablePost.thumbnailImage.filename)!}
                alt="Current thumbnail"
                width={160}
                height={160}
                className="object-cover rounded-md aspect-square"
              />
              {isEditing && (
                <Button size="sm" variant="destructive" className="mt-2 w-full" onClick={() => setEditablePost(prev => ({...prev, thumbnailImage: null}))}>
                  <Trash2 className="w-4 h-4 mr-2" /> Remove Thumbnail
                </Button>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">No thumbnail set. {isEditing && "Select one from the images below."}</p>
          )}
        </div>

        {/* === POST IMAGES SECTION === */}
        <div className="space-y-2">
          <h3 className="font-semibold">Post Pages</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {/* View/Edit Existing Images */}
            {editablePost.images?.map(image => (
              <div key={image.id}>
                <div className="relative">
                  <Image
                    src={getImageUrl(image.filename)!}
                    alt={`Post image ${image.id}`}
                    width={150}
                    height={150}
                    className={`object-cover rounded-md w-full aspect-square ${editablePost.thumbnailImage?.id === image.id ? 'ring-4 ring-blue-500' : ''}`}
                  />
                </div>
                {isEditing && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Button size="icon" variant="outline" title="Set as thumbnail" onClick={() => setAsThumbnail(image)}>
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" title="Remove image" onClick={() => markImageForDeletion(image.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {/* Display New Images for Upload */}
            {isEditing && newImageFiles.map((file, index) => (
              <div key={index}>
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`New image ${index + 1}`}
                  width={150}
                  height={150}
                  className="object-cover rounded-md w-full aspect-square"
                />
                <div className="flex items-center justify-center mt-2">
                  <Button size="icon" variant="destructive" title="Cancel upload" onClick={() => removeNewImage(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {/* Upload Button */}
            {isEditing && (
              <label htmlFor="image-upload" className="cursor-pointer w-full aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 transition-colors">
                <ImageIcon size={32} />
                <p className="mt-2 text-xs text-center">Add Images</p>
                <input id="image-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(",")} />
              </label>
            )}
          </div>
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
