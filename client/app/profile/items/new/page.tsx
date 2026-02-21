import Link from "next/link";
import { redirect } from "next/navigation";
import { VegasHeader } from "@/components/vegas/header";
import { createClient } from "@/lib/supabase/server";

const categoryOptions = [
  "Sports",
  "Clothing",
  "Electronics",
  "Accessories",
  "Outdoor",
] as const;
const conditionOptions = ["New", "Like New", "Good", "Fair"] as const;

export default async function AddItemPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please sign in to add an item");
  }

  async function submitItem() {
    "use server";
    redirect("/profile/items");
  }

  return (
    <div className="min-h-screen bg-black">
      <VegasHeader />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Add Item</h1>
            <p className="mt-2 text-gray-400">
              Submit an item to list in your profile.
            </p>
          </div>
          <Link
            href="/profile/items"
            className="rounded-lg bg-gray-800 px-4 py-2 font-semibold text-white transition-colors hover:bg-gray-700"
          >
            Back
          </Link>
        </div>

        <form
          action={submitItem}
          className="space-y-5 rounded-lg border border-red-900 bg-gradient-to-r from-gray-900 to-gray-800 p-6"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-gray-200"
            >
              Item Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-gray-700 bg-black/70 px-4 py-2 text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label
              htmlFor="imageUpload"
              className="mb-2 block text-sm font-semibold text-gray-200"
            >
              Upload Image
            </label>
            <input
              id="imageUpload"
              name="imageUpload"
              type="file"
              accept="image/*"
              className="w-full rounded-lg border border-dashed border-gray-600 bg-black/70 px-4 py-3 text-sm text-gray-200 file:mr-4 file:rounded file:border-0 file:bg-red-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-red-600"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold text-gray-200"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              className="w-full rounded-lg border border-gray-700 bg-black/70 px-4 py-2 text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-gray-200"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full rounded-lg border border-gray-700 bg-black/70 px-4 py-2 text-white outline-none focus:border-yellow-400"
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="condition"
                className="mb-2 block text-sm font-semibold text-gray-200"
              >
                Condition
              </label>
              <select
                id="condition"
                name="condition"
                required
                className="w-full rounded-lg border border-gray-700 bg-black/70 px-4 py-2 text-white outline-none focus:border-yellow-400"
              >
                {conditionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="estimatedValue"
                className="mb-2 block text-sm font-semibold text-gray-200"
              >
                Estimated Value ($)
              </label>
              <input
                id="estimatedValue"
                name="estimatedValue"
                type="number"
                min="1"
                required
                className="w-full rounded-lg border border-gray-700 bg-black/70 px-4 py-2 text-white outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label
                htmlFor="imageUrl"
                className="mb-2 block text-sm font-semibold text-gray-200"
              >
                Image URL
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                required
                className="w-full rounded-lg border border-gray-700 bg-black/70 px-4 py-2 text-white outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-red-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-600"
          >
            Submit Item
          </button>
        </form>
      </main>
    </div>
  );
}
