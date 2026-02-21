import Link from "next/link";
import { redirect } from "next/navigation";
import { VegasHeader } from "@/components/vegas/header";
import { ItemCard } from "@/components/vegas/item-card";
import { mapRowToItem } from "@/lib/vegas-data";
import { createClient } from "@/lib/supabase/server";

export default async function MyItemsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please sign in to view your items");
  }

  const fallbackUsername = user.email?.split("@")[0] || "player";
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.name || fallbackUsername;

  const { data: itemRows } = await supabase.from("items").select("*");
  const myItems = (itemRows ?? [])
    .map((row) => mapRowToItem(row))
    .filter(
      (item) =>
        item.ownerId === user.id ||
        item.ownerName === displayName ||
        item.ownerName === "You",
    );

  return (
    <div className="page-shell">
      <VegasHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-amber-200">My Items</h1>
            <p className="mt-2 text-zinc-400">Items currently listed under {displayName}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2 font-semibold text-white hover:border-zinc-400"
            >
              Back to Profile
            </Link>
            <Link
              href="/profile/items/new"
              className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-600"
            >
              Add Item
            </Link>
          </div>
        </div>

        {myItems.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
            <p className="text-lg text-zinc-200">No items listed yet.</p>
            <p className="mt-2 text-sm text-zinc-400">
              Add your first item to start gambling and trading.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
