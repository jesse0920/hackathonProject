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

type EditItemPageProps = {
  params: Promise<{ itemId: string }>;
};

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { itemId } = await params;
  const numericItemId = Number(itemId);

  if (!Number.isFinite(numericItemId)) {
    redirect("/profile/items");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please sign in to edit your item");
  }

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("item_id", numericItemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!item) {
    redirect("/profile/items");
  }

  async function updateItem(formData: FormData) {
    "use server";

    const sb = await createClient();
    const {
      data: { user: actionUser },
    } = await sb.auth.getUser();

    if (!actionUser) {
      redirect("/login?error=Please sign in to edit your item");
    }

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const condition = String(formData.get("condition") ?? "").trim();
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    const estimatedValue = Number(String(formData.get("estimatedValue") ?? ""));

    if (!name || !imageUrl || !Number.isFinite(estimatedValue) || estimatedValue <= 0) {
      redirect(`/profile/items/${numericItemId}/edit`);
    }

    const { error } = await sb
      .from("items")
      .update({
        name,
        desc: description,
        price: estimatedValue,
        url: imageUrl,
        category: category || "Misc",
        condition: condition || "Good",
      })
      .eq("item_id", numericItemId)
      .eq("user_id", actionUser.id);

    if (error) {
      console.error("[profile-items-edit] failed to update item", error);
      redirect(`/profile/items/${numericItemId}/edit`);
    }

    redirect("/profile/items");
  }

  return (
    <div className="page-shell">
      <VegasHeader />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-amber-200">Edit Item</h1>
            <p className="mt-2 text-zinc-400">Update your existing item listing.</p>
          </div>
          <Link
            href="/profile/items"
            className="rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2 font-semibold text-white hover:border-zinc-400"
          >
            Back
          </Link>
        </div>

        <form action={updateItem} className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-zinc-200">
              Item Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={item.name ?? ""}
              className="w-full rounded-lg border border-zinc-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-amber-300"
            />
          </div>

          <div>
            <label htmlFor="imageUpload" className="mb-2 block text-sm font-semibold text-zinc-200">
              Upload Image
            </label>
            <input
              id="imageUpload"
              name="imageUpload"
              type="file"
              accept="image/*"
              className="w-full rounded-lg border border-dashed border-zinc-600 bg-slate-950 px-4 py-3 text-sm text-zinc-200 file:mr-4 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-600"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-semibold text-zinc-200">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              defaultValue={typeof item.desc === "string" ? item.desc : ""}
              className="w-full rounded-lg border border-zinc-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-amber-300"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-semibold text-zinc-200">
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                defaultValue={typeof item.category === "string" ? item.category : categoryOptions[0]}
                className="w-full rounded-lg border border-zinc-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-amber-300"
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="mb-2 block text-sm font-semibold text-zinc-200">
                Condition
              </label>
              <select
                id="condition"
                name="condition"
                required
                defaultValue={typeof item.condition === "string" ? item.condition : conditionOptions[2]}
                className="w-full rounded-lg border border-zinc-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-amber-300"
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
              <label htmlFor="estimatedValue" className="mb-2 block text-sm font-semibold text-zinc-200">
                Estimated Value (coins)
              </label>
              <input
                id="estimatedValue"
                name="estimatedValue"
                type="number"
                min="1"
                required
                defaultValue={typeof item.price === "number" ? item.price : 1}
                className="w-full rounded-lg border border-zinc-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-amber-300"
              />
            </div>

            <div>
              <label htmlFor="imageUrl" className="mb-2 block text-sm font-semibold text-zinc-200">
                Image URL
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                required
                defaultValue={typeof item.url === "string" ? item.url : ""}
                className="w-full rounded-lg border border-zinc-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-amber-300"
              />
            </div>
          </div>

          <button type="submit" className="w-full rounded-lg bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-600">
            Save Changes
          </button>
        </form>
      </main>
    </div>
  );
}
