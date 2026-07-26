"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, UserCircle2, Home as HomeIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import NavSearchPill from "./NavSearchPill";

export default function Navbar() {
  const { user, logout, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-hairline">
      <div className="max-w-[1760px] mx-auto px-4 md:px-10 h-20 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <HomeIcon className="text-rausch" size={30} strokeWidth={2.5} />
          <span className="hidden sm:block text-rausch font-bold text-xl tracking-tight">airbnb</span>
        </Link>

        <NavSearchPill />

        <div className="flex items-center gap-3 shrink-0">
          {ready && user?.is_host && (
            <Link href="/host" className="hidden sm:block text-sm font-semibold px-3 py-2 rounded-full hover:bg-gray-100">
              Host dashboard
            </Link>
          )}
          {ready && !user && (
            <Link href="/host/listings/new" className="hidden sm:block text-sm font-semibold px-3 py-2 rounded-full hover:bg-gray-100">
              Airbnb your home
            </Link>
          )}

          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-3 border border-hairline rounded-full py-2 pl-3 pr-2 hover:shadow-pop transition-shadow"
              aria-label="Open menu"
            >
              <Menu size={16} />
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <UserCircle2 size={28} className="text-subtle" />
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-card border border-hairline py-2 animate-fadeIn">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm font-semibold border-b border-hairline mb-1">{user.name}</div>
                    <Link href="/trips" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">My trips</Link>
                    <Link href="/wishlist" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Wishlists</Link>
                    <Link href="/host" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Host dashboard</Link>
                    <Link href="/host/listings/new" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Create a listing</Link>
                    <div className="border-t border-hairline mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setOpen(false);
                          router.push("/");
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Log out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm font-semibold hover:bg-gray-50">Log in</Link>
                    <Link href="/login?mode=signup" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">Sign up</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
