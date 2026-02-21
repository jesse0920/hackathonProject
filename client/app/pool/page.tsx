"use client";

import { useEffect, useState } from "react";
import { VegasHeader } from "@/components/vegas/header";
import { ItemCard } from "@/components/vegas/item-card";
import { RouletteWheel } from "@/components/vegas/roulette-wheel";
import { mapRowToItem, type Item } from "@/lib/vegas-data";
import { createClient } from "@/lib/supabase/client";

function getTier(value: number) {
  if (value <= 5) return "$5 and below";
  if (value <= 25) return "$5 - $25";
  if (value <= 50) return "$25 - $50";
  if (value <= 75) return "$50 - $75";
  if (value <= 100) return "$75 - $100";
  if (value <= 250) return "$100 - $250";
  return "$250 - $500";
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

  useEffect(() => {
    const supabase = createClient();

    const loadItems = async () => {
      const { data, error } = await supabase.from("items").select("*");
      if (error) {
        setItems([]);
        setIsLoading(false);
        return;
      }
      setItems((data ?? []).map((row) => mapRowToItem(row)));
      setIsLoading(false);
    };

    void loadItems();
  }, []);

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
    if (selectedItems.length < 2) {
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    const winnerIndex = Math.floor(Math.random() * selectedItems.length);
    const winner = selectedItems[winnerIndex];
    const segmentAngle = 360 / selectedItems.length;
    const targetAngle = 360 - (winnerIndex * segmentAngle + segmentAngle / 2);
    const extraTurns = 360 * 5;

    setSpinAngle((previous) => previous + extraTurns + targetAngle);

    setTimeout(() => {
      setResult(winner);
      setIsSpinning(false);
      setShowResult(true);
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
    { key: "$5 and below", min: 0, max: 5 },
    { key: "$5 - $25", min: 5.01, max: 25 },
    { key: "$25 - $50", min: 25.01, max: 50 },
    { key: "$50 - $75", min: 50.01, max: 75 },
    { key: "$75 - $100", min: 75.01, max: 100 },
    { key: "$100 - $250", min: 100.01, max: 250 },
    { key: "$250 - $500", min: 250.01, max: 500 },
  ];

  return (
    <div className="min-h-screen bg-black">
      <VegasHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">Gamble Zone</h1>
          <p className="text-gray-400">
            Select 2-6 items to enter the pool, then spin the wheel to see who wins it all.
          </p>
        </div>

        {selectedItems.length > 0 ? (
          <section className="mb-8 rounded-lg border-2 border-red-900 bg-linear-to-b from-gray-900 to-gray-800 p-8">
            <RouletteWheel items={selectedItems} isSpinning={isSpinning} spinAngle={spinAngle} />

            <div className="mt-8 text-center">
              <p className="mb-4 text-gray-400">
                {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"} selected
                {selectedItems.length < 2 ? " (minimum 2 required)" : ""}
                {selectedItems.length >= 6 ? " (maximum reached)" : ""}
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={selectedItems.length < 2 || isSpinning}
                  className="rounded-lg bg-yellow-400 px-8 py-3 font-semibold text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSpinning ? "⟳ Spinning..." : "Spin The Wheel"}
                </button>

                {!isSpinning ? (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg bg-gray-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-600"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>

            {showResult && result ? (
              <div className="mt-8 rounded-lg border-2 border-yellow-400 bg-linear-to-r from-yellow-900/50 to-red-900/50 p-6">
                <div className="text-center">
                  <h2 className="mb-2 text-3xl font-bold text-white">Winner!</h2>
                  <p className="mb-4 text-xl text-yellow-400">{result.ownerName} wins all items!</p>
                  <div className="mx-auto max-w-sm">
                    <ItemCard item={result} />
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">
            Select Items To Gamble
            {selectedItems.length > 0 ? (
              <span className="ml-2 text-yellow-400">({selectedItems.length}/6)</span>
            ) : null}
          </h2>

          {notice ? (
            <div className="mb-4 rounded bg-red-900/60 px-4 py-2 text-sm text-red-200">{notice}</div>
          ) : null}

          {isLoading ? (
            <p className="py-16 text-center text-lg text-gray-400">Loading items...</p>
          ) : (
            <div className="space-y-8">
              {tiers.map((tier) => {
                const itemsInTier = items.filter((item) => item.price >= tier.min && item.price <= (tier.max ?? Number.POSITIVE_INFINITY));
                if (itemsInTier.length === 0) return null;

                return (
                  <div key={tier.key} className="rounded-md bg-gray-900/40 p-4">
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
