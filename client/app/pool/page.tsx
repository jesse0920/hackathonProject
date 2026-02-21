"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { VegasHeader } from "@/components/vegas/header";
import { ItemCard } from "@/components/vegas/item-card";
import { RouletteWheel } from "@/components/vegas/roulette-wheel";
import { mapRowToItem, type Item } from "@/lib/vegas-data";
import { createClient } from "@/lib/supabase/client";
import { VALUE_TIERS, getValueTier, isSameValueTier } from "@/lib/value-tier";

type TradeCreateResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  trade?: {
    trade_id?: number;
    status?: string;
    meetup_location?: string;
  };
};

type SpinResponse = {
  ok?: boolean;
  error?: string;
  winnerItemId?: string | number;
  winnerIndex?: number;
  targetAngle?: number;
  extraTurns?: number;
  durationMs?: number;
};

const POOL_ITEMS_CACHE_KEY = "potzi.pool.items.v3";
const POOL_ITEMS_CACHE_TTL_MS = 5 * 60 * 1000;

type PoolItemsCachePayload = {
  savedAt: number;
  items: Item[];
};

function normalizeAngle(value: number) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function readPoolItemsCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(POOL_ITEMS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PoolItemsCachePayload;
    if (
      !parsed ||
      !Array.isArray(parsed.items) ||
      typeof parsed.savedAt !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePoolItemsCache(items: Item[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: PoolItemsCachePayload = {
      savedAt: Date.now(),
      items,
    };
    window.localStorage.setItem(POOL_ITEMS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

export default function PoolPage() {
  const initialCachedItems = readPoolItemsCache();
  const hasFreshInitialCache = Boolean(
    initialCachedItems &&
      initialCachedItems.items.length > 0 &&
      Date.now() - initialCachedItems.savedAt < POOL_ITEMS_CACHE_TTL_MS,
  );

  const router = useRouter();
  const [items, setItems] = useState<Item[]>(
    hasFreshInitialCache ? initialCachedItems?.items ?? [] : [],
  );
  const [isLoading, setIsLoading] = useState(!hasFreshInitialCache);
  const [selectedMyItem, setSelectedMyItem] = useState<Item | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Item | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [spinDurationMs, setSpinDurationMs] = useState(4800);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [createdTradeId, setCreatedTradeId] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadItems = async () => {
      const cached = readPoolItemsCache();
      const isFreshCache = Boolean(
        cached &&
          cached.items.length > 0 &&
          Date.now() - cached.savedAt < POOL_ITEMS_CACHE_TTL_MS,
      );

      if (cached && cached.items.length > 0) {
        setItems(cached.items);
        setIsLoading(false);
      }

      if (isFreshCache) {
        return;
      }

      const { data: primaryRows, error } = await supabase
        .from("items")
        .select("item_id, name, price, category, condition, user_id, url")
        .order("item_id", { ascending: false })
        .limit(200);
      const { data: fallbackRows } = error
        ? await supabase
            .from("items")
            .select("item_id, name, price, user_id, url")
            .order("item_id", { ascending: false })
            .limit(200)
        : { data: null };
      const data = primaryRows ?? fallbackRows ?? [];

      if (error) {
        // Keep rendering resilient even if the optimized projection fails.
        if (data.length === 0) {
          setItems([]);
          setIsLoading(false);
          return;
        }
      }

      const ownerIdsNeedingLookup = Array.from(
        new Set(
          (data ?? [])
            .map((row) => {
              const ownerNameValue = (row as Record<string, unknown>).owner_name;
              const rawOwnerName =
                typeof ownerNameValue === "string" ? ownerNameValue.trim() : "";
              if (rawOwnerName.length > 0) return null;
              return typeof row.user_id === "string" ? row.user_id : null;
            })
            .filter((value): value is string => !!value),
        ),
      );

      let ownerNameById = new Map<string, string>();
      if (ownerIdsNeedingLookup.length > 0) {
        const { data: profileRowsRaw } = await supabase.rpc("get_profile_names", {
          profile_ids: ownerIdsNeedingLookup,
        });
        const profileRows = (profileRowsRaw ?? []) as { id: string; name: string | null }[];

        ownerNameById = new Map(
          profileRows.map((profile) => [
            profile.id,
            (profile.name || "Player").trim() || "Player",
          ]),
        );
      }

      const mappedItems = (data ?? []).map((row) =>
        mapRowToItem({
          ...row,
          owner_name:
            (typeof row.user_id === "string" && ownerNameById.get(row.user_id)) ||
            (row as Record<string, unknown>).owner_name,
        }),
      );
      setItems(
        mappedItems,
      );
      writePoolItemsCache(mappedItems);
      setIsLoading(false);
    };

    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
    };

    void loadItems();
    void loadCurrentUser();
  }, []);

  const myItems = useMemo(
    () => items.filter((item) => !!currentUserId && item.ownerId === currentUserId),
    [items, currentUserId],
  );
  const otherUsersItems = useMemo(
    () => items.filter((item) => !currentUserId || item.ownerId !== currentUserId),
    [items, currentUserId],
  );

  const rouletteCandidates = useMemo(() => {
    if (!selectedMyItem || !currentUserId) return [];

    return items.filter(
      (item) =>
        item.ownerId !== currentUserId &&
        isSameValueTier(Number(item.price), Number(selectedMyItem.price)),
    );
  }, [items, selectedMyItem, currentUserId]);

  const selectedTier = selectedMyItem ? getValueTier(Number(selectedMyItem.price)) : null;
  const myItemsByTier = useMemo(() => (
    VALUE_TIERS.map((tier) => ({
      tier,
      items: myItems.filter(
        (item) => item.price >= tier.min && item.price <= (tier.max ?? Number.POSITIVE_INFINITY),
      ),
    }))
  ), [myItems]);
  const otherItemsByTier = useMemo(() => (
    VALUE_TIERS.map((tier) => ({
      tier,
      items: otherUsersItems.filter(
        (item) => item.price >= tier.min && item.price <= (tier.max ?? Number.POSITIVE_INFINITY),
      ),
    }))
  ), [otherUsersItems]);

  const handleSelectMyItem = (item: Item) => {
    if (!currentUserId || item.ownerId !== currentUserId) {
      return;
    }

    setCreatedTradeId(null);
    setResult(null);
    setShowResult(false);
    setNotice(null);

    setSelectedMyItem((previous) => {
      if (previous && String(previous.id) === String(item.id)) {
        return null;
      }

      return item;
    });
  };

  const createTradeRequest = async (myItem: Item, landedItem: Item) => {
    const response = await fetch("/api/trades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requesterItemId: myItem.id,
        recipientItemId: landedItem.id,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as TradeCreateResponse;

    if (!response.ok || !payload.ok) {
      setNotice(payload.error || "Could not create trade request. Try spinning again.");
      window.setTimeout(() => setNotice(null), 4000);
      return;
    }

    const tradeId = Number(payload.trade?.trade_id);
    setCreatedTradeId(Number.isInteger(tradeId) && tradeId > 0 ? tradeId : null);
    setNotice(payload.message || "Trade request created.");
    window.setTimeout(() => setNotice(null), 4000);
  };

  const handleSpin = async () => {
    if (!selectedMyItem || rouletteCandidates.length < 1) {
      return;
    }

    const selectedItemSnapshot = selectedMyItem;
    const candidatesSnapshot = [...rouletteCandidates];

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);
    setCreatedTradeId(null);

    let winner: Item | undefined;
    let targetAngle = 0;
    let extraTurns = 0;
    let durationMs = 0;

    try {
      const spinResponse = await fetch("/api/pool/spin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requesterItemId: selectedItemSnapshot.id,
          candidateItemIds: candidatesSnapshot.map((item) => item.id),
        }),
      });
      const spinPayload = (await spinResponse.json().catch(() => ({}))) as SpinResponse;

      if (!spinResponse.ok || !spinPayload.ok) {
        setIsSpinning(false);
        setNotice(spinPayload.error || "Could not run spin. Refresh and try again.");
        window.setTimeout(() => setNotice(null), 4000);
        return;
      }

      const winnerId = String(spinPayload.winnerItemId ?? "");
      winner = candidatesSnapshot.find((item) => String(item.id) === winnerId);
      targetAngle = Number(spinPayload.targetAngle);
      extraTurns = Number(spinPayload.extraTurns);
      durationMs = Number(spinPayload.durationMs);
    } catch {
      setIsSpinning(false);
      setNotice("Could not run spin. Check your connection and try again.");
      window.setTimeout(() => setNotice(null), 4000);
      return;
    }

    if (
      !winner ||
      !Number.isFinite(targetAngle) ||
      !Number.isFinite(extraTurns) ||
      !Number.isFinite(durationMs)
    ) {
      setIsSpinning(false);
      setNotice("Spin result became stale. Refresh and try again.");
      window.setTimeout(() => setNotice(null), 4000);
      return;
    }

    setSpinDurationMs(durationMs);

    setSpinAngle((previous) => {
      const currentAngle = normalizeAngle(previous);
      const deltaToTarget = normalizeAngle(targetAngle - currentAngle);
      return previous + extraTurns + deltaToTarget;
    });

    setTimeout(() => {
      setResult(winner);
      setIsSpinning(false);
      setShowResult(true);
      void createTradeRequest(selectedItemSnapshot, winner);
    }, durationMs);
  };

  const handleReset = () => {
    setSelectedMyItem(null);
    setResult(null);
    setShowResult(false);
    setIsSpinning(false);
    setSpinAngle(0);
    setCreatedTradeId(null);
    setNotice(null);
  };

  const handleRemoveItem = async (item: Item) => {
    if (!currentUserId || item.ownerId !== currentUserId) {
      return;
    }

    const confirmed = window.confirm(`Remove "${item.name}" from the gamble pool?`);
    if (!confirmed) {
      return;
    }

    const numericItemId = Number(item.id);
    if (!Number.isFinite(numericItemId)) {
      setNotice("Unable to remove item: invalid item id.");
      window.setTimeout(() => setNotice(null), 3000);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("item_id", numericItemId)
      .eq("user_id", currentUserId);

    if (error) {
      setNotice(`Failed to remove item: ${error.message}`);
      window.setTimeout(() => setNotice(null), 3500);
      return;
    }

    setItems((previous) => previous.filter((existingItem) => String(existingItem.id) !== String(item.id)));
    setSelectedMyItem((previous) =>
      previous && String(previous.id) === String(item.id) ? null : previous,
    );

    setNotice("Item removed from gamble pool.");
    window.setTimeout(() => setNotice(null), 3000);
  };

  const handleEditItem = (item: Item) => {
    if (!currentUserId || item.ownerId !== currentUserId) {
      return;
    }

    router.push(`/profile/items/${item.id}/edit`);
  };

  return (
    <div className="page-shell">
      <VegasHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-amber-200">Gamble Zone</h1>
          <p className="text-zinc-400">
            Pick one of your items, spin in its value bracket, and launch a trade request.
          </p>
        </div>

        {selectedMyItem ? (
          <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
            <p className="mb-4 text-center text-zinc-300">
              Selected stake: <span className="font-semibold text-amber-300">{selectedMyItem.name}</span> ({selectedTier})
            </p>

            <RouletteWheel
              items={rouletteCandidates}
              isSpinning={isSpinning}
              spinAngle={spinAngle}
              spinDurationMs={spinDurationMs}
            />

            <div className="mt-8 text-center">
              <p className="mb-4 text-zinc-400">
                {rouletteCandidates.length} matching item{rouletteCandidates.length === 1 ? "" : "s"} in bracket
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={rouletteCandidates.length < 1 || isSpinning}
                  className="rounded-lg bg-amber-300 px-8 py-3 font-semibold text-black hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSpinning ? "Spinning..." : "Spin For Trade Match"}
                </button>

                {!isSpinning ? (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg border border-zinc-600 bg-zinc-900 px-6 py-3 font-semibold text-white hover:border-zinc-400"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>

            {showResult && result ? (
              <div className="mt-8 rounded-xl border border-amber-400/60 bg-zinc-900 p-6">
                <div className="text-center">
                  <h2 className="mb-2 text-3xl font-bold text-amber-200">Trade Match Found</h2>
                  <p className="mb-2 text-zinc-300">Your item matched with {result.ownerName}'s item.</p>
                  <p className="mb-4 text-sm text-zinc-400">
                    Trade stays pending until both users accept. Meetup location: Central PD.
                  </p>

                  <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
                    <ItemCard item={selectedMyItem} compact />
                    <ItemCard item={result} compact />
                  </div>

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Link
                      href="/profile/trades"
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                    >
                      Open Trade Requests
                    </Link>
                    {createdTradeId ? (
                      <p className="rounded-lg border border-zinc-700 bg-black/50 px-3 py-2 text-sm text-zinc-300">
                        Trade #{createdTradeId} created
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section>
          <h2 className="mb-4 text-2xl font-bold text-rose-200">Step 1: Select One Of Your Items</h2>

          {notice ? (
            <div className="mb-4 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-2 text-sm text-red-200">
              {notice}
            </div>
          ) : null}

          {isLoading ? (
            <p className="py-16 text-center text-lg text-zinc-400">Loading items...</p>
          ) : myItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-700 bg-slate-950 p-4 text-sm text-zinc-400">
              You have no items to gamble. Add one from your profile first.
            </p>
          ) : (
            <div className="space-y-8">
              {myItemsByTier.map(({ tier, items: itemsInTier }) => {
                if (itemsInTier.length === 0) return null;

                return (
                  <div key={tier.key} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-white">{tier.key}</h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {itemsInTier.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          selected={!!selectedMyItem && String(selectedMyItem.id) === String(item.id)}
                          showSelectButton
                          onSelect={handleSelectMyItem}
                          showEditButton={!!currentUserId && item.ownerId === currentUserId}
                          onEdit={handleEditItem}
                          editDisabled={isSpinning}
                          showRemoveButton={!!currentUserId && item.ownerId === currentUserId}
                          onRemove={handleRemoveItem}
                          removeDisabled={isSpinning}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {selectedMyItem ? (
          <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="mb-3 text-xl font-semibold text-white">Step 2: Bracket Roulette Pool</h2>
            <p className="mb-4 text-sm text-zinc-400">
              This wheel contains items from other users in <span className="font-semibold text-amber-300">{selectedTier}</span>.
            </p>
            {rouletteCandidates.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-700 bg-slate-950 p-4 text-sm text-zinc-400">
                No other users currently have items in this value bracket.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rouletteCandidates.map((item) => (
                  <ItemCard key={item.id} item={item} compact />
                ))}
              </div>
            )}
          </section>
        ) : null}

        <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-3 text-xl font-semibold text-white">Available Items By Tier</h2>
          <p className="mb-4 text-sm text-zinc-400">
            Preview all other users&apos; gamble items grouped by value bracket.
          </p>

          {otherUsersItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-700 bg-slate-950 p-4 text-sm text-zinc-400">
              No available opponent items are listed right now.
            </p>
          ) : (
            <div className="space-y-6">
              {otherItemsByTier.map(({ tier, items: tierItems }) => {
                if (tierItems.length === 0) return null;

                return (
                  <div key={`available-${tier.key}`} className="rounded-lg border border-zinc-800 bg-slate-950/70 p-4">
                    <h3 className="mb-3 text-base font-semibold text-amber-200">
                      {tier.key} ({tierItems.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {tierItems.map((item) => (
                        <ItemCard key={`available-${item.id}`} item={item} compact />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
