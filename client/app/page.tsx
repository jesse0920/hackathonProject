import Link from "next/link";
import { VegasHeader } from "@/components/vegas/header";
import { ItemCard } from "@/components/vegas/item-card";
import { mockItems } from "@/lib/vegas-data";

export default function Home() {
  const featuredItems = mockItems.slice(0, 3);

  return (
    <div className="min-h-screen bg-black">
      <VegasHeader />

      <section
        className="relative flex h-125 items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1491252706929-a72754910041?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080)",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black" />
        <div className="relative z-10 px-4 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white md:text-6xl">
            Welcome to <span className="text-yellow-400">Vegas Swap</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300 md:text-xl">
            Turn your unwanted items into treasure. Gamble with stuff you do not
            need and win what you actually want, the Vegas way.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/marketplace"
              className="rounded-lg bg-yellow-400 px-8 py-3 font-semibold text-black transition-colors hover:bg-yellow-300"
            >
              Browse Items
            </Link>
            <Link
              href="/pool"
              className="rounded-lg bg-red-700 px-8 py-3 font-semibold text-white transition-colors hover:bg-red-600"
            >
              Start Gambling
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-linear-to-b from-black to-gray-900 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-4xl font-bold text-white">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border-2 border-red-900 bg-gray-800 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-700 text-xl text-yellow-400">
                ✨
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">1. List Your Items</h3>
              <p className="text-gray-400">
                Upload unwanted items from your home, from bikes to electronics.
              </p>
            </div>
            <div className="rounded-lg border-2 border-red-900 bg-gray-800 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-700 text-xl text-yellow-400">
                🎲
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">2. Spin To Win</h3>
              <p className="text-gray-400">
                Pick items for the pool and spin the wheel. Winner takes all.
              </p>
            </div>
            <div className="rounded-lg border-2 border-red-900 bg-gray-800 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-700 text-xl text-yellow-400">
                📈
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">3. Get New Stuff</h3>
              <p className="text-gray-400">
                Win items you actually want and arrange a local pickup in Vegas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-900 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-4xl font-bold text-white">Featured Items</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/marketplace"
              className="inline-block rounded-lg bg-red-700 px-8 py-3 font-semibold text-white transition-colors hover:bg-red-600"
            >
              View All Items
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t-2 border-red-900 bg-black px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 text-5xl text-yellow-400">🛡️</div>
          <h3 className="mb-2 text-2xl font-semibold text-white">Safe and Local</h3>
          <p className="text-gray-400">
            All transactions stay within the Las Vegas community. Meet in public
            places and verify items before exchange. Gamble responsibly.
          </p>
        </div>
      </section>
    </div>
  );
}
