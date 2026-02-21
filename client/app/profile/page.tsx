import { VegasHeader } from "@/components/vegas/header";
import { ItemCard } from "@/components/vegas/item-card";
import { currentUser } from "@/lib/vegas-data";

export default function ProfilePage() {
  const winRate =
    currentUser.totalBets > 0 ? Math.round((currentUser.wins / currentUser.totalBets) * 100) : 0;

  return (
    <div className="min-h-screen bg-black">
      <VegasHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8 rounded-lg border-2 border-red-900 bg-gradient-to-r from-gray-900 to-gray-800 p-8">
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-400 text-5xl">
              {currentUser.avatar}
            </div>
            <div className="flex-1">
              <h1 className="mb-2 text-4xl font-bold text-white">{currentUser.name}</h1>
              <p className="text-gray-400">Las Vegas Community Member</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-700 bg-black/50 p-4">
              <p className="mb-2 text-sm text-gray-400">Items Owned</p>
              <p className="text-3xl font-bold text-white">{currentUser.items.length}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-black/50 p-4">
              <p className="mb-2 text-sm text-gray-400">Total Wins</p>
              <p className="text-3xl font-bold text-white">{currentUser.wins}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-black/50 p-4">
              <p className="mb-2 text-sm text-gray-400">Total Bets</p>
              <p className="text-3xl font-bold text-white">{currentUser.totalBets}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-black/50 p-4">
              <p className="mb-2 text-sm text-gray-400">Win Rate</p>
              <p className="text-3xl font-bold text-white">{winRate}%</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-3xl font-bold text-white">Your Items</h2>
          {currentUser.items.length === 0 ? (
            <div className="rounded-lg border-2 border-gray-800 bg-gray-900 p-12 text-center">
              <p className="mb-4 text-lg text-gray-400">You do not have any items yet.</p>
              <p className="text-gray-500">
                Win items by gambling or list your unwanted stuff to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {currentUser.items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 text-center">
          <button
            type="button"
            className="rounded-lg bg-red-700 px-8 py-3 font-semibold text-white transition-colors hover:bg-red-600"
          >
            List New Item
          </button>
          <p className="mt-2 text-sm text-gray-500">Add unwanted items to your inventory</p>
        </div>
      </main>
    </div>
  );
}
