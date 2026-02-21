import type { Item } from "@/lib/vegas-data";

type ItemCardProps = {
  item: Item;
  selected?: boolean;
  showSelectButton?: boolean;
  onSelect?: (item: Item) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function ItemCard({
  item,
  selected = false,
  showSelectButton = false,
  onSelect,
  disabled = false,
  compact = false,
}: ItemCardProps) {
  return (
    <article
      className={`overflow-hidden rounded-xl border bg-slate-950/80 transition ${
        selected
          ? "border-amber-300 shadow-lg shadow-amber-300/20"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <div className={`relative overflow-hidden ${compact ? "h-32" : "h-48"}`}>
        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        <div className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-amber-300">
          🪙 {item.price} coins
        </div>
      </div>

      <div className={compact ? "p-3" : "p-4"}>
        <h3 className={`mb-1 font-semibold text-white ${compact ? "text-base" : "text-lg"}`}>
          {item.name}
        </h3>
        <p
          className={`mb-3 text-zinc-400 ${compact ? "max-h-8 overflow-hidden text-xs" : "min-h-10 text-sm"}`}
        >
          {item.description}
        </p>

        <div className="mb-3 flex items-center gap-4 text-xs font-semibold text-zinc-400">
          <span>Condition: {item.condition}</span>
          <span>Owner: {item.ownerName}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
            {item.category}
          </span>

          {showSelectButton ? (
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                onSelect?.(item);
              }}
              disabled={disabled}
              className={`rounded-md px-4 py-1 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-amber-300 text-black"
                  : disabled
                    ? "cursor-not-allowed bg-zinc-700 text-zinc-200 opacity-60"
                    : "bg-red-700 text-white hover:bg-red-600"
              }`}
            >
              {selected ? "Selected" : disabled ? "Locked" : "Select"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
