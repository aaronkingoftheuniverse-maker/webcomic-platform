"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubscriberDTO } from "@/types/api/creator";

export default function SubscriptionsPage() {
  const [subscribers, setSubscribers] = useState<SubscriberDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscribers() {
      try {
        const res = await fetch("/api/creator/subscriptions");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch subscribers.");
        }
        const data = await res.json();
        setSubscribers(data.subscribers);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscribers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Subscribers</h2>
        <div className="flex items-center gap-2 text-gray-600">
          <Users size={20} />
          <span className="font-bold text-lg">{subscribers.length}</span>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <p className="text-gray-600">You don’t have any subscribers yet.</p>
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