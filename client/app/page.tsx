import Link from "next/link";
import Image from "next/image";
import { VegasHeader } from "@/components/vegas/header";
import { FeaturedItemsSection } from "@/components/vegas/featured-items-section";

export default async function Home() {
  return (
    <div className="page-shell">
      <VegasHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-20">
          <Image
            src="https://images.unsplash.com/photo-1491252706929-a72754910041?auto=format&fit=crop&w=1600&q=60&fm=webp"
            alt="Vegas background"
            fill
            sizes="100vw"
            quality={55}
            style={{ objectFit: "cover" }}
            priority
            placeholder="blur"
            blurDataURL="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='9' viewBox='0 0 16 9'><rect width='16' height='9' fill='%230f1724'/></svg>"
          />
        </div>
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative mx-auto grid min-h-120 w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              Vegas Community Swap
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-amber-100 sm:text-5xl md:text-6xl">
              Play The Pool.
              <br />
              Win Better Gear.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-zinc-200 sm:text-lg">
              Like a sportsbook board, but with virtual-coin item tiers. Enter a
              fair coin bracket, spin, and claim the winning pool.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["Live Pools 18", "Avg Pot 🪙 142", "Max Entries 6"].map((line) => (
                <span
                  key={line}
                  className="rounded-full border border-zinc-500 bg-black/50 px-3 py-1 text-xs font-semibold text-zinc-100"
                >
                  {line}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-700 bg-zinc-950/90 p-4 shadow-2xl shadow-black/40">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Action Board
            </p>
            <div className="space-y-2">
              <Link
                href="/pool"
                className="block rounded-lg bg-amber-300 px-4 py-3 text-center text-base font-extrabold text-black hover:bg-amber-200"
              >
                Enter Gamble Pool
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/profile"
                  className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-center text-sm font-semibold text-zinc-100 hover:border-zinc-400"
                >
                  My Profile
                </Link>
                <Link
                  href="/profile/items/new"
                  className="rounded-lg border border-red-500/70 bg-red-700 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-red-600"
                >
                  List Item
                </Link>
              </div>
              <Link
                href="/info"
                className="block rounded-lg border border-zinc-700 px-3 py-2 text-center text-sm font-semibold text-zinc-300 hover:bg-white/5"
              >
                Rules and Safety
              </Link>
            </div>

            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Current Lines
              </p>
              <div className="mt-2 space-y-1.5 text-sm">
                <p className="flex items-center justify-between text-zinc-200">
                  <span>🪙 25-50 coins Tier</span>
                  <span className="font-bold text-emerald-300">Hot</span>
                </p>
                <p className="flex items-center justify-between text-zinc-300">
                  <span>🪙 75-100 coins Tier</span>
                  <span className="font-semibold text-zinc-200">Filling</span>
                </p>
                <p className="flex items-center justify-between text-zinc-300">
                  <span>🪙 100-250 coins Tier</span>
                  <span className="font-semibold text-zinc-200">Open</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-amber-200 sm:text-4xl">How It Works</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[{
              title: "List Your Items",
              body: "Upload unwanted items from bikes to electronics.",
            }, {
              title: "Join a Value Pool",
              body: "Enter pools with items from the same price tier.",
            }, {
              title: "Spin To Win",
              body: "A random winner takes the pooled items.",
            }, {
              title: "Trade Safely",
              body: "Meet in a public location and verify before exchanging.",
            }].map((step, index) => (
              <article key={step.title} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
                <span className="text-sm font-semibold text-amber-300">0{index + 1}</span>
                <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FeaturedItemsSection />

      <section className="border-t border-white/10 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 text-center">
          <h3 className="text-2xl font-semibold text-white">Safe and Local</h3>
          <p className="mt-2 text-zinc-400">
            All transactions stay within the Las Vegas community. Meet in public
            places and verify items before exchange.
          </p>
        </div>
      </section>
    </div>
  );
}
