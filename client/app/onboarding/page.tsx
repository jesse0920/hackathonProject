"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function accept() {
    if (!agree) return setError("You must agree to the rules to continue.");
    setLoading(true);
    setError(null);
    try {
      // Client-only acceptance: store locally and proceed. Do not call server DB.
      if (typeof window !== "undefined") {
        localStorage.setItem("onboarded", "true");
      }
      router.replace("/profile");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  // Block navigation while user hasn't accepted: prevent anchor clicks, warn on unload,
  // and push history state to discourage back navigation.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You must accept the rules before leaving.";
      return "You must accept the rules before leaving.";
    };

    const onClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Allow interactions with form controls and labels so checkbox works
      if (target.closest && target.closest("input,button,textarea,select,label")) return;

      const link = target.closest && (target.closest("a") as HTMLAnchorElement | null);
      if (link && link.href) {
        e.preventDefault();
        e.stopPropagation();
        // brief user feedback
        // eslint-disable-next-line no-alert
        alert("You must accept the site rules before navigating away.");
      }
    };

    const onPopState = () => {
      // push the user back to the onboarding route
      if (window.location.pathname !== "/onboarding") {
        history.pushState(null, "", "/onboarding");
        // eslint-disable-next-line no-alert
        alert("You must accept the site rules before navigating away.");
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload, { capture: true });
    document.addEventListener("click", onClickCapture, true);
    window.addEventListener("popstate", onPopState);

    // push initial history state so popstate can be used to trap back button
    history.pushState(null, "", window.location.pathname);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload, { capture: true } as any);
      document.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-900 via-black to-red-900 text-white">
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-lg bg-neutral-900/90 p-6 shadow-xl border border-yellow-500">
          <h1 className="text-3xl font-bold">Welcome to Potzi</h1>
          <p className="mt-3 text-neutral-200">
            Thanks for joining — this is a community item marketplace and pool. Please read and
            agree to the community rules before using the site. You will not be able to navigate
            away until you accept.
          </p>

          <section className="mt-6">
            <h2 className="text-xl font-semibold text-yellow-300">Community Rules</h2>
            <ol className="mt-3 list-decimal list-inside space-y-2 text-neutral-200">
              <li>Be respectful to other members.</li>
              <li>No fraudulent listings or misrepresentations.</li>
              <li>Follow all applicable laws.</li>
              <li>Only list items you own or have permission to sell.</li>
              <li>Violations may result in account suspension.</li>
            </ol>
          </section>

          <div className="mt-6 flex items-center gap-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="h-5 w-5 rounded border-neutral-400 bg-white/5 checked:bg-yellow-400"
              />
              <span className="text-neutral-200">I have read and agree to the rules.</span>
            </label>
          </div>

          {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={accept}
              disabled={loading}
              className="rounded bg-yellow-400 px-4 py-2 font-semibold text-black hover:brightness-95 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Accept and Continue"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
