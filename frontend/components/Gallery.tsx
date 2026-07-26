"use client";

import Image from "next/image";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Grip } from "lucide-react";
import type { Photo } from "@/types";

export default function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  if (photos.length === 0) return null;

  const main = photos[0];
  const rest = photos.slice(1, 5);

  return (
    <>
      <div className="relative grid grid-cols-4 grid-rows-2 gap-2 rounded-xl2 overflow-hidden h-[280px] sm:h-[420px]">
        <button className="relative col-span-4 sm:col-span-2 row-span-2" onClick={() => setLightboxIndex(0)}>
          <Image src={main.url} alt={title} fill sizes="50vw" className="object-cover hover:brightness-90 transition" priority />
        </button>
        {rest.map((p, i) => (
          <button key={p.id} className="relative hidden sm:block" onClick={() => setLightboxIndex(i + 1)}>
            <Image src={p.url} alt={title} fill sizes="25vw" className="object-cover hover:brightness-90 transition" />
          </button>
        ))}
        {photos.length > 1 && (
          <button
            onClick={() => setLightboxIndex(0)}
            className="absolute bottom-4 right-4 bg-white border border-ink rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-pop"
          >
            <Grip size={16} /> Show all photos
          </button>
        )}
      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[90] bg-black flex flex-col animate-fadeIn">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setLightboxIndex(null)} className="text-white p-2 hover:bg-white/10 rounded-full">
              <X size={22} />
            </button>
            <span className="text-white text-sm">{lightboxIndex + 1} / {photos.length}</span>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <button
              onClick={() => setLightboxIndex((i) => (i! - 1 + photos.length) % photos.length)}
              className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full z-10"
              aria-label="Previous photo"
            >
              <ChevronLeft size={28} />
            </button>
            <div className="relative w-full h-full max-w-5xl mx-auto">
              <Image src={photos[lightboxIndex].url} alt={title} fill sizes="100vw" className="object-contain" />
            </div>
            <button
              onClick={() => setLightboxIndex((i) => (i! + 1) % photos.length)}
              className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full z-10"
              aria-label="Next photo"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
