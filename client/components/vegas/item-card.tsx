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
      className={`overflow-hidden rounded-lg border-2 bg-gray-900 transition-all ${
        selected
          ? "border-yellow-400 shadow-lg shadow-yellow-400/30"
          : "border-gray-700 hover:border-gray-600"
      }`}
    >
      <div className={`relative overflow-hidden ${compact ? "h-32" : "h-48"}`}>
        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        <div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-yellow-400">
          ${item.price}
        </div>
      </div>

      <div className={compact ? "p-3" : "p-4"}>
        <h3 className={`mb-1 font-semibold text-white ${compact ? "text-base" : "text-lg"}`}>
          {item.name}
        </h3>
        <p
          className={`mb-3 text-gray-400 ${compact ? "max-h-8 overflow-hidden text-xs" : "min-h-10 text-sm"}`}
        >
          {item.description}
        </p>

        <div className="mb-3 flex items-center gap-4 text-xs text-gray-400 font-bold">
          <span>Condition: {item.condition}</span>
          <span>Owner: {item.ownerName}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="rounded bg-red-900/50 px-2 py-1 text-xs text-red-300">
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
              className={`rounded px-4 py-1 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-yellow-400 text-black"
                  : disabled
                  ? "bg-gray-600 text-gray-200 cursor-not-allowed opacity-60"
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
