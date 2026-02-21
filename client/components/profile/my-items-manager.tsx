"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ItemCard } from "@/components/vegas/item-card";
import { type Item } from "@/lib/vegas-data";
import { createClient } from "@/lib/supabase/client";

type MyItemsManagerProps = {
  initialItems: Item[];
  currentUserId: string;
};

export function MyItemsManager({ initialItems, currentUserId }: MyItemsManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [notice, setNotice] = useState<string | null>(null);

  const handleRemoveItem = async (item: Item) => {
    const confirmed = window.confirm(`Remove "${item.name}" from your listed items?`);
    if (!confirmed) return;

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

    setItems((previous) =>
      previous.filter((existingItem) => String(existingItem.id) !== String(item.id)),
    );
    setNotice("Item removed.");
    window.setTimeout(() => setNotice(null), 3000);
  };

  const handleEditItem = (item: Item) => {
    router.push(`/profile/items/${item.id}/edit`);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
        <p className="text-lg text-zinc-200">No items listed yet.</p>
        <p className="mt-2 text-sm text-zinc-400">
          Add your first item to start gambling and trading.
        </p>
      </div>
    );
  }

  return (
    <>
      {notice ? (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-2 text-sm text-red-200">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            showEditButton
            onEdit={handleEditItem}
            showRemoveButton
            onRemove={handleRemoveItem}
          />
        ))}
      </div>
    </>
  );
}
