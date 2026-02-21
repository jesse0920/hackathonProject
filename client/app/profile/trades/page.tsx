"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { VegasHeader } from "@/components/vegas/header";

type TradeItem = {
  item_id: number;
  name: string;
  price: number;
  url: string | null;
  category: string | null;
  condition: string | null;
  user_id: string;
};

type Trade = {
  tradeId: number;
  status: "pending" | "accepted" | "declined" | "cancelled" | "completed";
  requesterApproved: boolean;
  recipientApproved: boolean;
  meetupLocation: string;
  createdAt: string;
  updatedAt: string;
  declinedBy: string | null;
  requester: { id: string; name: string };
  recipient: { id: string; name: string };
  requesterItem: TradeItem | null;
  recipientItem: TradeItem | null;
};

type TradeResponse = {
  ok?: boolean;
  error?: string;
  currentUserId?: string;
  trades?: Trade[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function ItemPreview({ label, item }: { label: string; item: TradeItem | null }) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-black/40 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      {item ? (
        <>
          <p className="mt-1 font-semibold text-white">{item.name}</p>
          <p className="text-sm text-zinc-300">🪙 {item.price} coins</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-zinc-400">Item unavailable.</p>
      )}
    </div>
  );
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTradeId, setActiveTradeId] = useState<number | null>(null);

  const loadTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/trades", { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as TradeResponse;

    if (!response.ok || !payload.ok) {
      setError(payload.error || "Failed to load trade requests.");
      setTrades([]);
      setIsLoading(false);
      return;
    }

    setTrades(payload.trades ?? []);
    setCurrentUserId(payload.currentUserId ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  const patchTrade = useCallback(
    async (tradeId: number, action: "accept" | "decline" | "cancel" | "complete") => {
      setActiveTradeId(tradeId);
      setError(null);

      const response = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(payload.error || "Unable to update trade request.");
        setActiveTradeId(null);
        return;
      }

      await loadTrades();
      setActiveTradeId(null);
    },
    [loadTrades],
  );

  const sortedTrades = useMemo(
    () => [...trades].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [trades],
  );

  return (
    <div className="page-shell">
      <VegasHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-amber-200">Trade Requests</h1>
            <p className="mt-1 text-sm text-zinc-400">
              When both users accept, complete the exchange at <span className="font-semibold text-amber-300">Central PD</span>.
            </p>
          </div>
          <Link
            href="/pool"
            className="rounded-lg border border-amber-400/70 bg-amber-300 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-200"
          >
            Start New Gamble
          </Link>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {isLoading ? <p className="text-zinc-400">Loading trade requests...</p> : null}

        {!isLoading && sortedTrades.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-700 bg-slate-950 p-4 text-sm text-zinc-400">
            No trade requests yet.
          </p>
        ) : null}

        <div className="space-y-4">
          {sortedTrades.map((trade) => {
            const pending = trade.status === "pending";
            const accepted = trade.status === "accepted";
            const disabled = activeTradeId === trade.tradeId;
            const isRequester = !!currentUserId && trade.requester.id === currentUserId;
            const isRecipient = !!currentUserId && trade.recipient.id === currentUserId;
            const selfApproved = isRequester ? trade.requesterApproved : isRecipient ? trade.recipientApproved : false;

            return (
              <article key={trade.tradeId} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Trade #{trade.tradeId}</p>
                    <p className="text-sm text-zinc-300">
                      {trade.requester.name} requested a swap with {trade.recipient.name}
                    </p>
                  </div>
                  <div className="rounded-md border border-zinc-700 bg-black/40 px-3 py-1 text-xs font-semibold text-amber-200">
                    {trade.status.toUpperCase()}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ItemPreview label={`${trade.requester.name} offers`} item={trade.requesterItem} />
                  <ItemPreview label={`${trade.recipient.name} offers`} item={trade.recipientItem} />
                </div>

                <div className="mt-3 text-xs text-zinc-400">
                  <p>Created: {formatDate(trade.createdAt)}</p>
                  <p>
                    Approvals: requester {trade.requesterApproved ? "accepted" : "waiting"} | recipient {trade.recipientApproved ? "accepted" : "waiting"}
                  </p>
                  {accepted ? <p className="text-emerald-300">Meet at {trade.meetupLocation} to finish the swap.</p> : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {pending ? (
                    <>
                      {!selfApproved ? (
                        <button
                          type="button"
                          onClick={() => void patchTrade(trade.tradeId, "accept")}
                          disabled={disabled}
                          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Accept
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void patchTrade(trade.tradeId, "decline")}
                        disabled={disabled}
                        className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Decline
                      </button>
                      {isRequester ? (
                        <button
                          type="button"
                          onClick={() => void patchTrade(trade.tradeId, "cancel")}
                          disabled={disabled}
                          className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </>
                  ) : null}

                  {accepted ? (
                    <button
                      type="button"
                      onClick={() => void patchTrade(trade.tradeId, "complete")}
                      disabled={disabled}
                      className="rounded-md bg-amber-300 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Mark Completed
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
