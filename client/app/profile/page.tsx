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

  const displayName = profile?.name || fallbackUsername;
  const wins = profile?.wins ?? 0;
  const totalBets = profile?.totalBets ?? 0;
  const initials = displayName.slice(0, 2).toUpperCase();

  const { data: itemRows } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("item_id", { ascending: false });
  const myItems = (itemRows ?? []).map((row) => mapRowToItem(row));

  return (
    <div className="page-shell">
      <VegasHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-amber-300 text-2xl font-black text-black sm:h-20 sm:w-20 sm:text-3xl">
                {initials}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                  Player Profile
                </p>
                <h1 className="mt-1 text-2xl font-bold text-rose-200 sm:text-3xl">
                  {displayName}
                </h1>
                <p className="mt-1 text-sm text-zinc-300 sm:text-base">{user.email}</p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-700 bg-slate-950 px-4 py-3 text-xs text-zinc-400 sm:text-sm">
              <span className="font-semibold text-zinc-300">User ID:</span> {user.id}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Name</p>
            <p className="mt-2 truncate text-lg font-semibold text-white sm:text-xl">
              {displayName}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Wins</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{wins}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Total Bets</p>
            <p className="mt-2 text-2xl font-bold text-amber-300">{totalBets}</p>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">My Item Cards</h2>
              <p className="mt-1 text-sm text-zinc-400">All items currently listed by you.</p>
            </div>
            <Link
              href="/profile/items/new"
              className="rounded-lg border border-red-500/70 bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Add New Item
            </Link>
          </div>

          {myItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-700 bg-slate-950 p-4 text-sm text-zinc-400">
              No items listed yet.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
