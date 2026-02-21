"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VegasHeader } from "@/components/vegas/header";
import { ItemCard } from "@/components/vegas/item-card";
import { RouletteWheel } from "@/components/vegas/roulette-wheel";
import { mapRowToItem, type Item } from "@/lib/vegas-data";
import { createClient } from "@/lib/supabase/client";

function getTier(value: number) {
  if (value <= 5) return "5 coins and below";
  if (value <= 25) return "5-25 coins";
  if (value <= 50) return "25-50 coins";
  if (value <= 75) return "50-75 coins";
  if (value <= 100) return "75-100 coins";
  if (value <= 250) return "100-250 coins";
  return "250-500 coins";
}

export default function PoolPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Item | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadItems = async () => {
      const { data, error } = await supabase.from("items").select("*");
      if (error) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      const ownerIds = Array.from(
        new Set(
          (data ?? [])
            .map((row) => (typeof row.user_id === "string" ? row.user_id : null))
            .filter((value): value is string => !!value),
        ),
      );

      let ownerNameById = new Map<string, string>();
      if (ownerIds.length > 0) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", ownerIds);

        ownerNameById = new Map(
          (profileRows ?? []).map((profile) => [profile.id, profile.name || "Unknown"]),
        );
      }

      setItems(
        (data ?? []).map((row) =>
          mapRowToItem({
            ...row,
            owner_name:
              (typeof row.user_id === "string" && ownerNameById.get(row.user_id)) ||
              row.owner_name,
          }),
        ),
      );
      setIsLoading(false);
    };

    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
    };

    void loadItems();
    void loadCurrentUser();
  }, []);

  const handleWonItemsSave = async (winner: Item, poolItems: Item[]) => {
    const supabase = createClient();

    let activeUserId = currentUserId;
    if (!activeUserId) {
      const { data } = await supabase.auth.getUser();
      activeUserId = data.user?.id ?? null;
      setCurrentUserId(activeUserId);
    }

    if (!activeUserId || winner.ownerId !== activeUserId) {
      return;
    }

    // Increment wins on each successful personal spin win.
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("wins")
      .eq("id", activeUserId)
      .maybeSingle();
    let winsError: { message?: string } | null = null;

    if (profileRow) {
      const nextWins = (profileRow.wins ?? 0) + 1;
      const result = await supabase
        .from("profiles")
        .update({ wins: nextWins })
        .eq("id", activeUserId);
      winsError = result.error;
    } else {
      const { data: authData } = await supabase.auth.getUser();
      const fallbackName = authData.user?.email?.split("@")[0] || "player";
      const result = await supabase.from("profiles").upsert(
        {
          id: activeUserId,
          name: fallbackName,
          wins: 1,
          totalBets: 0,
        },
        { onConflict: "id" },
      );
      winsError = result.error;
    }

    if (winsError) {
      setNotice("You won, but updating your wins count failed.");
      window.setTimeout(() => setNotice(null), 3500);
    }

    const wonItems = Array.from(
      new Map(
        poolItems
          .filter((item) => item.ownerId && item.ownerId !== activeUserId)
          .map((item) => [String(item.id), item]),
      ).values(),
    );

    if (wonItems.length === 0) {
      if (!winsError) {
        setNotice("Win recorded.");
        window.setTimeout(() => setNotice(null), 3500);
      }
      return;
    }

    const results = await Promise.all(
      wonItems.map(async (item) => {
        const response = await fetch("/api/profile/received", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId: item.id,
            senderId: item.ownerId || null,
            note: "Won in gamble spin",
          }),
        });

        return response.ok;
      }),
    );

    if (results.every(Boolean)) {
      setNotice(`Saved ${wonItems.length} won item${wonItems.length > 1 ? "s" : ""} to your profile.`);
      window.setTimeout(() => setNotice(null), 3500);
      return;
    }

    setNotice("Some won items could not be saved. Try spinning again.");
    window.setTimeout(() => setNotice(null), 3500);
  };

  const handleSelectItem = (item: Item) => {
    setSelectedItems((previous) => {
      const isSelected = previous.some((selectedItem) => selectedItem.id === item.id);

      if (isSelected) {
        return previous.filter((selectedItem) => selectedItem.id !== item.id);
      }

      if (previous.length >= 6) {
        return previous;
      }

      if (previous.length > 0) {
        const firstTier = getTier(previous[0].price);
        const itemTier = getTier(item.price);
        if (firstTier !== itemTier) {
          setNotice(`Selections are locked to the tier: ${firstTier}`);
          window.setTimeout(() => setNotice(null), 3000);
          return previous;
        }
      }

      return [...previous, item];
    });
  };

  const handleSpin = () => {
    if (selectedItems.length < 1) {
      return;
    }

    const poolSnapshot = [...selectedItems];

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    const winnerIndex = Math.floor(Math.random() * poolSnapshot.length);
    const winner = poolSnapshot[winnerIndex];
    const segmentAngle = 360 / poolSnapshot.length;
    const targetAngle = 360 - (winnerIndex * segmentAngle + segmentAngle / 2);
    const extraTurns = 360 * 5;

    setSpinAngle((previous) => previous + extraTurns + targetAngle);

    setTimeout(() => {
      setResult(winner);
      setIsSpinning(false);
      setShowResult(true);
      void handleWonItemsSave(winner, poolSnapshot);
    }, 4000);
  };

  const handleReset = () => {
    setSelectedItems([]);
    setResult(null);
    setShowResult(false);
    setIsSpinning(false);
    setSpinAngle(0);
  };

  const tiers: { key: string; min: number; max: number | null }[] = [
    { key: "5 coins and below", min: 0, max: 5 },
    { key: "5-25 coins", min: 5.01, max: 25 },
    { key: "25-50 coins", min: 25.01, max: 50 },
    { key: "50-75 coins", min: 50.01, max: 75 },
    { key: "75-100 coins", min: 75.01, max: 100 },
    { key: "100-250 coins", min: 100.01, max: 250 },
    { key: "250-500 coins", min: 250.01, max: 500 },
  ];

  return (
    <div className="page-shell">
      <VegasHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-amber-200">Gamble Zone</h1>
          <p className="text-zinc-400">
            Select 1-6 items in the same value tier, then spin to pick the winner.
          </p>
        </div>

        {selectedItems.length > 0 ? (
          <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
            <RouletteWheel items={selectedItems} isSpinning={isSpinning} spinAngle={spinAngle} />

            <div className="mt-8 text-center">
              <p className="mb-4 text-zinc-400">
                {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"} selected
                {selectedItems.length >= 6 ? " (maximum reached)" : ""}
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={selectedItems.length < 1 || isSpinning}
                  className="rounded-lg bg-amber-300 px-8 py-3 font-semibold text-black hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSpinning ? "Spinning..." : "Spin The Wheel"}
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
                  <h2 className="mb-2 text-3xl font-bold text-amber-200">Winner!</h2>
                  <p className="mb-4 text-xl text-amber-300">{result.ownerName} wins all items!</p>
                  {currentUserId && result.ownerId === currentUserId ? (
                    <div className="mb-4">
                      <p className="text-sm text-green-300">
                        You won this spin. Won items are being saved to your profile.
                      </p>
                      <Link
                        href="/profile/won"
                        className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                      >
                        View Won Items
                      </Link>
                    </div>
                  ) : null}
                  <div className="mx-auto max-w-sm">
                    <ItemCard item={result} />
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section>
          <h2 className="mb-4 text-2xl font-bold text-rose-200">
            Select Items To Gamble
            {selectedItems.length > 0 ? (
              <span className="ml-2 text-amber-300">({selectedItems.length}/6)</span>
            ) : null}
          </h2>

          {notice ? (
            <div className="mb-4 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-2 text-sm text-red-200">
              {notice}
            </div>
          ) : null}

          {isLoading ? (
            <p className="py-16 text-center text-lg text-zinc-400">Loading items...</p>
          ) : (
            <div className="space-y-8">
              {tiers.map((tier) => {
                const itemsInTier = items.filter((item) => item.price >= tier.min && item.price <= (tier.max ?? Number.POSITIVE_INFINITY));
                if (itemsInTier.length === 0) return null;

                return (
                  <div key={tier.key} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-white">{tier.key}</h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {itemsInTier.map((item) => {
                        const selectionTier = selectedItems[0] ? getTier(selectedItems[0].price) : null;
                        const itemTier = getTier(item.price);

                        const disabled =
                          !!selectionTier &&
                          selectionTier !== itemTier &&
                          !selectedItems.some((selectedItem) => selectedItem.id === item.id);

                        return (
                          <ItemCard
                            key={item.id}
                            item={item}
                            selected={selectedItems.some((selectedItem) => selectedItem.id === item.id)}
                            showSelectButton
                            onSelect={handleSelectItem}
                            disabled={disabled}
                          />
                        );
                      })}
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
