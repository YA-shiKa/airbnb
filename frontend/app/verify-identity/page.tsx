"use client";

import { ShieldCheck } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function VerifyIdentityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Identity verification</h1>
      <EmptyState
        icon={ShieldCheck}
        title="Identity verification is coming soon"
        description="Verifying your identity isn't available yet in this preview. Once it launches, hosts and guests will be able to confirm a government ID to build trust before booking or hosting a stay."
        actionLabel="Explore stays"
        actionHref="/"
      />
    </div>
  );
}
