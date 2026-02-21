import Link from "next/link";
import { VegasHeader } from "@/components/vegas/header";

export default function InfoPage() {
  return (
    <div className="page-shell">
      <VegasHeader />

      <header className="border-b border-white/10 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">How It Works</p>
          <h1 className="mt-3 text-4xl font-bold text-amber-200 md:text-5xl">Clear Rules. Fair Pools.</h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-300">
            Learn how items are assessed, matched, and safely traded in Potzi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5"
            >
              Back Home
            </Link>
            <Link
              href="/marketplace"
              className="rounded-md bg-amber-300 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-200"
            >
              Browse Items
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="grid gap-6 md:grid-cols-2">
            <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
              <h2 className="mb-4 text-2xl font-bold text-rose-200">Upload and Describe</h2>
              <p className="mb-4 text-zinc-300">
                Include a realistic value, item details, and photos. Accurate listings
                help everyone match fairly.
              </p>
              <ul className="list-disc pl-5 text-zinc-300">
                <li>Estimated value</li>
                <li>Brand</li>
                <li>Short description</li>
                <li>Product link (optional)</li>
              </ul>
            </article>

            <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
              <h2 className="mb-4 text-2xl font-bold text-rose-200">Assessment Brackets</h2>
              <p className="mb-4 text-zinc-300">
                Items are grouped by value so each pool has comparable stakes.
              </p>
              <div className="grid gap-3">
                <div className="rounded-md border border-zinc-700 bg-slate-950 p-3 text-zinc-200">
                  <strong className="text-amber-300">Low</strong>: under 49 coins
                </div>
                <div className="rounded-md border border-zinc-700 bg-slate-950 p-3 text-zinc-200">
                  <strong className="text-amber-300">Medium</strong>: 50-99 coins
                </div>
                <div className="rounded-md border border-zinc-700 bg-slate-950 p-3 text-zinc-200">
                  <strong className="text-amber-300">High</strong>: 100-149 coins
                </div>
                <div className="rounded-md border border-zinc-700 bg-slate-950 p-3 text-zinc-200">
                  <strong className="text-amber-300">Premium</strong>: over 150 coins
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="mb-4 text-2xl font-bold text-rose-200">Gambling and Matching</h2>
            <p className="text-zinc-300">
              You can enter an item into eligible pools and spin with similar-value items.
              If both sides agree after a result, you can proceed to exchange.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
              <h2 className="mb-4 text-2xl font-bold text-rose-200">Meeting and Safety</h2>
              <p className="mb-4 text-zinc-300">
                Trades should happen at the LVMPD Community Center or another public
                police-station location.
              </p>
              <p className="font-semibold text-amber-300">You are never required to trade.</p>
            </article>

            <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
              <h2 className="mb-4 text-2xl font-bold text-rose-200">Finalizing a Trade</h2>
              <ol className="list-decimal pl-5 text-zinc-300">
                <li>Both parties confirm.</li>
                <li>Agree on location and time.</li>
                <li>Inspect items before exchange.</li>
              </ol>
            </article>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="mb-4 text-2xl font-bold text-rose-200">Need Help?</h2>
            <p className="text-zinc-300">
              Questions about brackets, assessments, or safe exchanges can be handled
              through support in the app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
