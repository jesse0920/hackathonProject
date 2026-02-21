"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/pool", label: "Gamble" },
  { href: "/profile", label: "Profile" },
];

export function VegasHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } finally {
      router.push("/login");
      router.refresh();
      setIsSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="text-2xl font-black tracking-tight">
            Pot<span className="text-amber-300">zi</span>
          </span>
        </Link>

        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors md:text-base ${
                  isActive
                    ? "bg-white/10 text-amber-200"
                    : "text-zinc-200 hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <details className="relative">
            <summary className="flex list-none h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-bold text-amber-200 hover:border-zinc-500 [&::-webkit-details-marker]:hidden">
              P
            </summary>
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-zinc-700 bg-zinc-950 p-2 shadow-xl">
              <Link
                href="/profile"
                className="block rounded-md px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-70"
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}
