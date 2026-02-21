import Link from "next/link";
import { redirect } from "next/navigation";
import { VegasHeader } from "@/components/vegas/header";
import { MyItemsManager } from "@/components/profile/my-items-manager";
import { mapRowToItem } from "@/lib/vegas-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  const primaryItemProjection =
    "item_id, name, desc, price, url, category, condition, user_id, owner_name, available_for_gamble";
  const fallbackItemProjection =
    "item_id, name, desc, price, url, category, condition, user_id";
  const minimalItemProjection = "item_id, name, price, user_id, url";

  const { data: primaryItemRows, error: primaryItemError } = await supabase
    .from("items")
    .select(primaryItemProjection)
    .eq("user_id", user.id)
    .order("item_id", { ascending: false });
  const { data: fallbackItemRows, error: fallbackItemError } = primaryItemError
    ? await supabase
        .from("items")
        .select(fallbackItemProjection)
        .eq("user_id", user.id)
        .order("item_id", { ascending: false })
    : { data: null, error: null };
  const { data: minimalItemRows, error: minimalItemError } =
    primaryItemError && fallbackItemError
      ? await supabase
          .from("items")
          .select(minimalItemProjection)
          .eq("user_id", user.id)
          .order("item_id", { ascending: false })
      : { data: null, error: null };

  if (primaryItemError && fallbackItemError && minimalItemError) {
    console.error("[profile/items] failed to load items", {
      primary: primaryItemError.message,
      fallback: fallbackItemError.message,
      minimal: minimalItemError.message,
    });
  }

  const itemRows = primaryItemRows ?? fallbackItemRows ?? minimalItemRows ?? [];
  const myItems = itemRows.map((row) =>
    mapRowToItem({
      ...row,
      owner_name: displayName,
    }),
  );

  return (
    <div className="page-shell">
      <VegasHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-amber-200">My Items</h1>
            <p className="mt-2 text-zinc-400">
              Items you currently own (posted by you or won in trades/spins).
            </p>
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

        <MyItemsManager initialItems={myItems} currentUserId={user.id} />
      </main>
    </div>
  );
}
