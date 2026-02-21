"use client";

import { useMemo, useState } from "react";
import { VegasHeader } from "@/components/vegas/header";
import { ItemCard } from "@/components/vegas/item-card";
import { categories, mockItems } from "@/lib/vegas-data";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>("All");

  const filteredItems = useMemo(() => {
    return mockItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-black">
      <VegasHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-4xl font-bold text-white">Marketplace</h1>
        <p className="mb-8 text-gray-400">
          Browse unwanted items from the Vegas community and add items to your
          gambling pool.
        </p>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 py-3 pl-10 pr-4 text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-gray-400">Filter:</span>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === category
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <p className="py-16 text-center text-lg text-gray-400">
            No items found matching your criteria.
          </p>
        ) : (
          <>
            <p className="mb-6 text-gray-400">
              Showing {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
