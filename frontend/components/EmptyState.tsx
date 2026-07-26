import { LucideIcon, SearchX } from "lucide-react";
import Link from "next/link";

export default function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4">
      <Icon size={40} className="text-subtle mb-4" strokeWidth={1.5} />
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      {description && <p className="text-subtle text-sm max-w-sm mb-4">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="bg-ink text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-black transition-colors">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
