import { redirect } from "next/navigation";
import Link from "next/link";
import { VegasHeader } from "@/components/vegas/header";
import { ItemCard } from "@/components/vegas/item-card";
import { mapRowToItem } from "@/lib/vegas-data";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please sign in to view your profile");
  }

  const fallbackUsername = user.email?.split("@")[0] || "player";

  let { data: profile } = await supabase
    .from("profiles")
    .select("id, avatar_url, name, wins, totalBets")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        name: fallbackUsername,
        wins: 0,
        totalBets: 0,
      },
      { onConflict: "id" },
    );

    const profileResult = await supabase
      .from("profiles")
      .select("id, avatar_url, name, wins, totalBets")
      .eq("id", user.id)
      .maybeSingle();

    profile = profileResult.data;
  }

  async function signOut() {
    "use server";
    const sb = await createClient();
    await sb.auth.signOut();
    redirect("/login");
  }

  const displayName = profile?.name || fallbackUsername;
  const wins = profile?.wins ?? 0;
  const totalBets = profile?.totalBets ?? 0;

  const { data: itemRows } = await supabase.from("items").select("*");
  const previewItem = (itemRows ?? [])
    .map((row) => mapRowToItem(row))
    .find((item) => item.ownerId === user.id || item.ownerName === displayName);

  return (
    <div className="min-h-screen bg-black">
      <VegasHeader />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-lg border-2 border-red-900 bg-gradient-to-r from-gray-900 to-gray-800 p-8">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400 text-4xl font-bold text-black">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-white">
                {displayName}
              </h1>
              <p className="text-gray-300">{user.email}</p>
              <p className="mt-1 text-sm text-gray-500">User ID: {user.id}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-700 bg-black/50 p-4">
              <p className="mb-2 text-sm text-gray-400">Name</p>
              <p className="text-xl font-semibold text-white">{displayName}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-black/50 p-4">
              <p className="mb-2 text-sm text-gray-400">Wins</p>
              <p className="text-xl font-semibold text-white">{wins}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-black/50 p-4">
              <p className="mb-2 text-sm text-gray-400">Total Bets</p>
              <p className="text-xl font-semibold text-white">{totalBets}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-white">
              My Item Card
            </h2>
            <div className="max-w-xs">
              {previewItem ? (
                <ItemCard item={previewItem} compact />
              ) : (
                <p className="rounded-lg border border-gray-700 bg-black/50 p-4 text-sm text-gray-400">
                  No items listed yet.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/profile/items"
              className="rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black transition-colors hover:bg-yellow-300"
            >
              My Items
            </Link>
            <Link
              href="/profile/items/new"
              className="rounded-lg bg-red-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-600"
            >
              Add Item
            </Link>
          </div>

          <form action={signOut} className="mt-8">
            <button
              type="submit"
              className="rounded-lg bg-red-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-600"
            >
              Sign out
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
