"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, BookOpen, Users, ImageIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SubscribedComicDTO,
  CreatorComicWithSubscribersDTO,
  CreatorProfileSubscriberDTO,
} from "@/types/api/creator";
import { Button } from "@/components/ui/button";

interface SubscriptionData {
  subscribedComics: SubscribedComicDTO[];
  creatorComicsWithSubscribers: CreatorComicWithSubscribersDTO[] | null;
  creatorProfileSubscribers: CreatorProfileSubscriberDTO[] | null;
}

export default function SubscriptionsPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscriptionData() {
      try {
        const res = await fetch("/api/creator/subscriptions");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch subscription data.");
        }
        const responseData: SubscriptionData = await res.json();
        setData(responseData);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSubscriptionData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <UserSubscriptions comics={data?.subscribedComics} />
      <CreatorSubscribers comicData={data?.creatorComicsWithSubscribers} />
      <CreatorProfileSubscribers subscribers={data?.creatorProfileSubscribers} />
    </div>
  );
}

function UserSubscriptions({ comics }: { comics?: SubscribedComicDTO[] }) {
  if (!comics) return null;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Subscriptions</h2>
        <div className="flex items-center gap-2 text-gray-600">
          <BookOpen size={20} />
          <span className="font-bold text-lg">{comics.length}</span>
        </div>
      </div>
      {comics.length === 0 ? (
        <p className="text-gray-600">You haven’t subscribed to any comics yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comics.map((comic) => (
              <TableRow key={comic.id}>
                <TableCell>
                  {comic.coverImage ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}${comic.coverImage}`}
                      alt={`Cover for ${comic.title}`}
                      width={40} height={40}
                      className="object-cover rounded-md w-10 h-10 bg-gray-100"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{comic.title}</TableCell>
                <TableCell>{comic.creatorProfile.user.username}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/comics/${comic.slug}`}><Button variant="outline" size="sm">View Comic</Button></Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function CreatorSubscribers({ comicData }: { comicData?: CreatorComicWithSubscribersDTO[] | null }) {
  if (!comicData) return null;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Subscribers By Comic</h2>
      </div>
      {comicData.length === 0 ? (
        <p className="text-gray-600">You don’t have any comics with subscribers yet.</p>
      ) : (
        <div className="space-y-6">
          {comicData.map((comic) => (
            <div key={comic.id}>
              <h3 className="font-semibold text-lg mb-2">{comic.title} ({comic.subscribers.length})</h3>
              {comic.subscribers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Joined Platform</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comic.subscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">{subscriber.username}</TableCell>
                        <TableCell>{subscriber.email}</TableCell>
                        <TableCell className="text-right">{new Date(subscriber.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-gray-500 italic">No subscribers for this comic yet.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatorProfileSubscribers({ subscribers }: { subscribers?: CreatorProfileSubscriberDTO[] | null }) {
  if (!subscribers) return null;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Creator Profile Subscribers</h2>
        <div className="flex items-center gap-2 text-gray-600">
          <Users size={20} />
          <span className="font-bold text-lg">{subscribers.length}</span>
        </div>
      </div>
      {subscribers.length === 0 ? (
        <p className="text-gray-600">No one has subscribed to your creator profile yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Joined Platform</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell className="font-medium">{subscriber.username}</TableCell>
                <TableCell>{subscriber.email}</TableCell>
                <TableCell className="text-right">{new Date(subscriber.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
