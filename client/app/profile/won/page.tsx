import Link from "next/link";
import { redirect } from "next/navigation";
import { VegasHeader } from "@/components/vegas/header";
import { ItemCard } from "@/components/vegas/item-card";
import { mapRowToItem } from "@/lib/vegas-data";
import { createClient } from "@/lib/supabase/server";

type ReceivedRow = {
  received_id: number;
  received_at: string | null;
  note: string | null;
  sender_id: string | null;
  item_id: string;
};

function formatDate(input: string | null) {
  if (!input) return "Unknown date";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
}

export default async function WonItemsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please sign in to view won items");
  }

  const { data: receivedRowsRaw, error: receivedError } = await supabase
    .from("profile_received_items")
    .select("received_id, received_at, note, sender_id, item_id")
    .eq("receiver_id", user.id)
    .order("received_at", { ascending: false });

  if (receivedError) {
    return (
      <div className="page-shell">
        <VegasHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-lg border border-red-900 bg-red-950/40 p-6 text-red-200">
            Failed to load won items: {receivedError.message}
          </div>
        </main>
      </div>
    );
  }

  const receivedRows = (receivedRowsRaw ?? []) as ReceivedRow[];
  const senderIds = Array.from(
    new Set(
      receivedRows
        .map((row) => row.sender_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );
  const numericItemIds = Array.from(
    new Set(
      receivedRows
        .map((row) => Number(row.item_id))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );

  const [{ data: senderRowsRaw }, { data: itemRows }] = await Promise.all([
    senderIds.length > 0
      ? supabase.rpc("get_profile_names", { profile_ids: senderIds })
      : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
    numericItemIds.length > 0
      ? supabase.from("items").select("*").in("item_id", numericItemIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);
  const senderRows = (senderRowsRaw ?? []) as { id: string; name: string | null }[];

  const senderNameById = new Map(
    (senderRows ?? []).map((row) => [row.id, (row.name || "Player").trim() || "Player"]),
  );
  const itemById = new Map(
    (itemRows ?? []).map((row) => [String(row.item_id ?? ""), row]),
  );

  const wonItems = receivedRows.map((row) => {
    const senderName = row.sender_id ? (senderNameById.get(row.sender_id) ?? "Player") : "Player";
    const itemRow =
      itemById.get(String(row.item_id)) ?? {
        item_id: row.item_id,
        name: "Unknown Item",
        desc: "This item is no longer available.",
        price: 0,
        url: "/file.svg",
        category: "Misc",
        condition: "Good",
        user_id: row.sender_id ?? "",
      };

    return {
      receivedId: row.received_id,
      receivedAt: row.received_at,
      note: row.note,
      senderName,
      item: mapRowToItem({
        ...itemRow,
        owner_name: senderName,
      }),
    };
  });

  return (
    <div className="page-shell">
      <VegasHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-amber-200">Won Items</h1>
            <p className="mt-2 text-gray-400">Items you have won from gamble spins.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-lg bg-gray-800 px-4 py-2 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Back to Profile
            </Link>
            <Link
              href="/pool"
              className="rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-black transition-colors hover:bg-yellow-300"
            >
              Gamble
            </Link>
          </div>
        </div>

        {wonItems.length === 0 ? (
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-8 text-center">
            <p className="text-lg text-gray-200">No won items yet.</p>
            <p className="mt-2 text-sm text-gray-400">
              Win a spin in Gamble Zone and your items will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wonItems.map((wonItem) => (
              <div key={`${wonItem.item.id}-${wonItem.receivedId}`}>
                <ItemCard item={wonItem.item} />
                <div className="mt-2 rounded border border-gray-700 bg-black/50 p-3 text-xs text-gray-300">
                  <p>Won from: {wonItem.senderName}</p>
                  <p>Won at: {formatDate(wonItem.receivedAt)}</p>
                  {wonItem.note ? <p>Note: {wonItem.note}</p> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
