import type { Item } from "@/lib/vegas-data";

type ItemCardProps = {
  item: Item;
  selected?: boolean;
  showSelectButton?: boolean;
  onSelect?: (item: Item) => void;
  showEditButton?: boolean;
  onEdit?: (item: Item) => void;
  editDisabled?: boolean;
  showRemoveButton?: boolean;
  onRemove?: (item: Item) => void;
  removeDisabled?: boolean;
  disabled?: boolean;
  compact?: boolean;
};

export function ItemCard({
  item,
  selected = false,
  showSelectButton = false,
  onSelect,
  showEditButton = false,
  onEdit,
  editDisabled = false,
  showRemoveButton = false,
  onRemove,
  removeDisabled = false,
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
        <img src={item.imageUrl || "/file.svg"} alt={item.name} className="h-full w-full object-cover" />
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

          {showSelectButton || showEditButton || showRemoveButton ? (
            <div className="flex items-center gap-2">
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

              {showEditButton ? (
                <button
                  type="button"
                  onClick={() => {
                    if (editDisabled) return;
                    onEdit?.(item);
                  }}
                  disabled={editDisabled}
                  className={`rounded-md px-3 py-1 text-sm font-semibold transition-colors ${
                    editDisabled
                      ? "cursor-not-allowed bg-zinc-700 text-zinc-200 opacity-60"
                      : "bg-amber-300 text-black hover:bg-amber-200"
                  }`}
                >
                  Edit
                </button>
              ) : null}

              {showRemoveButton ? (
                <button
                  type="button"
                  onClick={() => {
                    if (removeDisabled) return;
                    onRemove?.(item);
                  }}
                  disabled={removeDisabled}
                  className={`rounded-md px-3 py-1 text-sm font-semibold transition-colors ${
                    removeDisabled
                      ? "cursor-not-allowed bg-zinc-700 text-zinc-200 opacity-60"
                      : "bg-zinc-200 text-black hover:bg-white"
                  }`}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
