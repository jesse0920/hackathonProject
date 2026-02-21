// @Author: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
// @Purpose: Example of fetching data from Supabase in a Next.js page using Suspense

import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { VegasHeader } from "@/components/vegas/header";

async function ItemsData() {
  const supabase = await createClient();
  const { data: items } = await supabase.from("items").select();

  return (
    <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs text-zinc-200">
      {JSON.stringify(items, null, 2)}
    </pre>
  );
}

export default function items() {
  return (
    <div className="page-shell">
      <VegasHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-4 text-3xl font-bold text-amber-200">Items (Raw Data)</h1>
        <Suspense fallback={<div className="text-zinc-400">Loading items...</div>}>
          <ItemsData />
        </Suspense>
      </main>
    </div>
  );
}
