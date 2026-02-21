import Link from "next/link";
import { redirect } from "next/navigation";
import { VegasHeader } from "@/components/vegas/header";
import { ItemCard } from "@/components/vegas/item-card";
import { mapRowToItem } from "@/lib/vegas-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ReceivedRow = {
  received_id: number;
  received_at: string | null;
  note: string | null;
  sender_id: string | null;
  item_id: string;
};

type CompletedTradeRow = {
  trade_id: number;
  requester_id: string;
  recipient_id: string;
  requester_item_id: number;
  recipient_item_id: number;
  updated_at: string | null;
};

type WonSourceRow = {
  sourceId: string;
  receivedAt: string | null;
  note: string | null;
  senderId: string | null;
  itemId: string;
};

function formatDate(input: string | null) {
  if (!input) return "Unknown date";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
}

function toTimestamp(input: string | null) {
  if (!input) return 0;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 0;
  return date.getTime();
}

export default async function WonItemsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please sign in to view won items");
  }

  const primaryItemProjection =
    "item_id, name, desc, price, url, category, condition, user_id, owner_name, available_for_gamble";
  const fallbackItemProjection =
    "item_id, name, desc, price, url, category, condition, user_id";
  const minimalItemProjection = "item_id, name, price, user_id, url";

  const { data: receivedRowsRaw, error: receivedError } = await supabase
    .from("profile_received_items")
    .select("received_id, received_at, note, sender_id, item_id")
    .eq("receiver_id", user.id)
    .order("received_at", { ascending: false });

  if (receivedError) {
    console.error("[profile/won] failed to load profile_received_items", receivedError.message);
  }

  const { data: completedTradeRowsRaw, error: completedTradeError } = await supabase
    .from("trade_requests")
    .select("trade_id, requester_id, recipient_id, requester_item_id, recipient_item_id, updated_at")
    .eq("status", "completed")
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (completedTradeError) {
    console.error("[profile/won] failed to load completed trades", completedTradeError.message);
  }

  if (receivedError && completedTradeError) {
    return (
      <div className="page-shell">
        <VegasHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-lg border border-red-900 bg-red-950/40 p-6 text-red-200">
            Failed to load won items.
          </div>
        </main>
      </div>
    );
  }

  const receivedRows = (receivedRowsRaw ?? []) as ReceivedRow[];
  const completedTradeRows = (completedTradeRowsRaw ?? []) as CompletedTradeRow[];
  const tradeWonRows = completedTradeRows.flatMap((trade) => {
    const isRequester = trade.requester_id === user.id;
    const isRecipient = trade.recipient_id === user.id;
    if (!isRequester && !isRecipient) return [];

    const itemId = isRequester ? trade.recipient_item_id : trade.requester_item_id;
    const senderId = isRequester ? trade.recipient_id : trade.requester_id;

    return [
      {
        sourceId: `trade-${trade.trade_id}`,
        receivedAt: trade.updated_at,
        note: `Trade completed #${trade.trade_id}`,
        senderId,
        itemId: String(itemId),
      } satisfies WonSourceRow,
    ];
  });

  const receivedWonRows = receivedRows.map((row) => ({
    sourceId: `receipt-${row.received_id}`,
    receivedAt: row.received_at,
    note: row.note,
    senderId: row.sender_id,
    itemId: String(row.item_id),
  }));
  const wonRowsByItemId = new Map<string, WonSourceRow>();
  const mergedWonRows = [...receivedWonRows, ...tradeWonRows].sort(
    (a, b) => toTimestamp(b.receivedAt) - toTimestamp(a.receivedAt),
  );
  for (const row of mergedWonRows) {
    if (!row.itemId) continue;
    if (!wonRowsByItemId.has(row.itemId)) {
      wonRowsByItemId.set(row.itemId, row);
    }
  }
  const wonRows = Array.from(wonRowsByItemId.values());

  const senderIds = Array.from(
    new Set(
      wonRows
        .map((row) => row.senderId)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );
  const numericItemIds = Array.from(
    new Set(
      wonRows
        .map((row) => Number(row.itemId))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );

  const [{ data: senderRowsRaw }, itemQueryResult] = await Promise.all([
    senderIds.length > 0
      ? supabase.rpc("get_profile_names", { profile_ids: senderIds })
      : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
    numericItemIds.length > 0
      ? supabase
          .from("items")
          .select(primaryItemProjection)
          .in("item_id", numericItemIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
  ]);

  const wonItemRowsPrimary = itemQueryResult.data as Record<string, unknown>[] | null;
  const wonItemRowsError = itemQueryResult.error;
  const wonItemRowsFallbackResult =
    wonItemRowsError && numericItemIds.length > 0
      ? await supabase
          .from("items")
          .select(fallbackItemProjection)
          .in("item_id", numericItemIds)
      : { data: null, error: null };
  const wonItemRowsMinimalResult =
    wonItemRowsError &&
    wonItemRowsFallbackResult.error &&
    numericItemIds.length > 0
      ? await supabase
          .from("items")
          .select(minimalItemProjection)
          .in("item_id", numericItemIds)
      : { data: null, error: null };

  if (wonItemRowsError && wonItemRowsFallbackResult.error && wonItemRowsMinimalResult.error) {
    console.error("[profile/won] failed to load won item rows", {
      primary: wonItemRowsError.message,
      fallback: wonItemRowsFallbackResult.error.message,
      minimal: wonItemRowsMinimalResult.error.message,
    });
  }

  const senderRows = (senderRowsRaw ?? []) as { id: string; name: string | null }[];

  const senderNameById = new Map(
    (senderRows ?? []).map((row) => [row.id, (row.name || "Player").trim() || "Player"]),
  );
  const itemById = new Map(
    (wonItemRowsPrimary ?? wonItemRowsFallbackResult.data ?? wonItemRowsMinimalResult.data ?? []).map((row) => [
      String(row.item_id ?? ""),
      row,
    ]),
  );

  const wonItems = wonRows.flatMap((row) => {
    const itemRow = itemById.get(String(row.itemId));
    if (!itemRow) return [];

    const senderName = row.senderId ? (senderNameById.get(row.senderId) ?? "Player") : "Player";

    return [
      {
        receivedId: row.sourceId,
        receivedAt: row.receivedAt,
        note: row.note,
        senderName,
        item: mapRowToItem({
          ...itemRow,
          owner_name: senderName,
        }),
      },
    ];
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
