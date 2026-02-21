"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ItemCard } from "@/components/vegas/item-card";
import { mapRowToItem, type Item } from "@/lib/vegas-data";
import { createClient } from "@/lib/supabase/client";

const FEATURED_ITEMS_CACHE_KEY = "potzi.home.featured-items.v1";
const FEATURED_ITEMS_CACHE_TTL_MS = 2 * 60 * 1000;

type FeaturedItemsCachePayload = {
  savedAt: number;
  items: Item[];
};

function readFeaturedItemsCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FEATURED_ITEMS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FeaturedItemsCachePayload;
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

function writeFeaturedItemsCache(items: Item[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: FeaturedItemsCachePayload = {
      savedAt: Date.now(),
      items,
    };
    window.localStorage.setItem(FEATURED_ITEMS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

export function FeaturedItemsSection() {
  const [featuredItems, setFeaturedItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadFeaturedItems = async () => {
      const cached = readFeaturedItemsCache();
      if (
        cached &&
        Date.now() - cached.savedAt < FEATURED_ITEMS_CACHE_TTL_MS &&
        cached.items.length > 0
      ) {
        setFeaturedItems(cached.items);
        setIsLoading(false);
        return;
      }

      const { data: itemRows, error } = await supabase
        .from("items")
        .select("item_id, name, desc, price, url, category, condition, user_id")
        .order("item_id", { ascending: false })
        .limit(18);

      if (error) {
        setFeaturedItems([]);
        setIsLoading(false);
        return;
      }

      const ownerIds = Array.from(
        new Set(
          (itemRows ?? [])
            .map((row) => (typeof row.user_id === "string" ? row.user_id : null))
            .filter((value): value is string => !!value),
        ),
      );

      let ownerNameById = new Map<string, string>();
      if (ownerIds.length > 0) {
        const { data: profileRowsRaw } = await supabase.rpc("get_profile_names", {
          profile_ids: ownerIds,
        });
        const profileRows = (profileRowsRaw ?? []) as { id: string; name: string | null }[];
        ownerNameById = new Map(
          profileRows.map((profile) => [
            profile.id,
            (profile.name || "Player").trim() || "Player",
          ]),
        );
      }

      const mapped = (itemRows ?? [])
        .map((row) =>
          mapRowToItem({
            ...row,
            owner_name:
              (typeof row.user_id === "string" && ownerNameById.get(row.user_id)) ||
              (row as Record<string, unknown>).owner_name,
          }),
        )
        .slice(0, 3);

      setFeaturedItems(mapped);
      writeFeaturedItemsCache(mapped);
      setIsLoading(false);
    };

    void loadFeaturedItems();
  }, []);

  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold text-amber-200 sm:text-4xl">Featured Items</h2>
          <Link href="/profile/items/new" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
            Add your item
          </Link>
        </div>
        {isLoading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
            <p className="text-zinc-300">Loading featured items...</p>
          </div>
        ) : featuredItems.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
            <p className="text-zinc-300">No user-listed items yet.</p>
            <p className="mt-2 text-sm text-zinc-400">
              Be the first to add a real item to the marketplace.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {featuredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
