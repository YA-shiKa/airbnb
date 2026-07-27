"use client";

import { MessageCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function MessagesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Messages</h1>
      <EmptyState
        icon={MessageCircle}
        title="Messaging is coming soon"
        description="Direct messaging between guests and hosts isn't available yet in this preview. Once it launches, you'll be able to ask a host questions before booking and coordinate check-in details here."
        actionLabel="Explore stays"
        actionHref="/"
      />
    </div>
  );
}
