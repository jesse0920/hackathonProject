"use client";

import { useState } from "react";

type CopilotProps = {
  className?: string;
};

type Suggestion = {
  improvedTitle: string;
  improvedDescription: string;
  suggestedCategory: "Sports" | "Clothing" | "Electronics" | "Accessories" | "Outdoor";
  suggestedCondition: "New" | "Like New" | "Good" | "Fair";
  recommendedCoins: number;
  estimatedMinCoins: number;
  estimatedMaxCoins: number;
  riskFlags: string[];
  safetyNote: string;
};

function setInputValueById(id: string, value: string) {
  const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  if (!element) return;
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function AiListingCopilot({ className = "" }: CopilotProps) {
  const [extraNotes, setExtraNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const runAssistant = async () => {
    const title = (document.getElementById("name") as HTMLInputElement | null)?.value?.trim() || "";
    const description = (document.getElementById("description") as HTMLTextAreaElement | null)?.value?.trim() || "";
    const category = (document.getElementById("category") as HTMLSelectElement | null)?.value?.trim() || "";
    const condition = (document.getElementById("condition") as HTMLSelectElement | null)?.value?.trim() || "";

    if (!title && !description && !extraNotes.trim()) {
      setError("Add a title, description, or some notes first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const response = await fetch("/api/ai/listing-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          category,
          condition,
          extraNotes: extraNotes.trim(),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        suggestion?: Suggestion;
      };

      if (!response.ok || !payload.ok || !payload.suggestion) {
        setError(payload.error || "Could not generate AI suggestion.");
        return;
      }

      setSuggestion(payload.suggestion);
    } catch {
      setError("Network error while requesting AI suggestion.");
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setInputValueById("name", suggestion.improvedTitle);
    setInputValueById("description", suggestion.improvedDescription);
    setInputValueById("category", suggestion.suggestedCategory);
    setInputValueById("condition", suggestion.suggestedCondition);
    setInputValueById("estimatedValue", String(suggestion.recommendedCoins));
  };

  return (
    <section className={`rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-emerald-300">AI Listing Copilot</h2>
          <p className="mt-1 text-sm text-zinc-300">
            Suggests clearer copy, fair coin range, and safety flags before you submit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runAssistant()}
          disabled={isLoading}
          className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Analyzing..." : "Generate AI Suggestion"}
        </button>
      </div>

      <div className="mt-3">
        <label htmlFor="ai-extra-notes" className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Extra Context (optional)
        </label>
        <textarea
          id="ai-extra-notes"
          value={extraNotes}
          onChange={(event) => setExtraNotes(event.target.value)}
          rows={2}
          placeholder="Any extra details: age, defects, included accessories, original price..."
          className="w-full rounded-lg border border-zinc-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
        />
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {suggestion ? (
        <div className="mt-4 rounded-lg border border-zinc-700 bg-slate-950/70 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Suggested Listing</p>
            <button
              type="button"
              onClick={applySuggestion}
              className="rounded-md border border-emerald-400/70 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
            >
              Apply To Form
            </button>
          </div>

          <p className="text-sm text-zinc-200">
            <span className="font-semibold text-emerald-300">Title:</span> {suggestion.improvedTitle}
          </p>
          <p className="mt-2 text-sm text-zinc-300">{suggestion.improvedDescription}</p>
          <p className="mt-3 text-sm text-zinc-200">
            Value range: <span className="font-semibold text-amber-300">{suggestion.estimatedMinCoins} - {suggestion.estimatedMaxCoins} coins</span>
            {" · "}
            Recommended: <span className="font-semibold text-amber-200">{suggestion.recommendedCoins}</span>
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Category: {suggestion.suggestedCategory} · Condition: {suggestion.suggestedCondition}
          </p>

          {suggestion.riskFlags.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-rose-200">
              {suggestion.riskFlags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          ) : null}

          <p className="mt-3 text-xs text-zinc-400">{suggestion.safetyNote}</p>
        </div>
      ) : null}
    </section>
  );
}
