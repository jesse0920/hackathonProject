"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "✨" },
  { href: "/marketplace", label: "Marketplace", icon: "📦" },
  { href: "/pool", label: "Gamble", icon: "🎲" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export function VegasHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b-4 border-yellow-500 bg-gradient-to-r from-red-900 via-black to-red-900">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="text-2xl">✨</span>
          <span className="text-2xl font-bold">
            Vegas <span className="text-yellow-400">Swap</span>
          </span>
        </Link>

        <nav className="flex flex-wrap gap-2 md:gap-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-2 text-sm transition-colors md:text-base ${
                  isActive
                    ? "bg-red-700 text-yellow-300"
                    : "text-white hover:bg-red-800"
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
