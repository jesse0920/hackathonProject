import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfileItemsPayload = {
  postedItems: unknown[];
};

type CreateItemBody = {
  name?: string;
  description?: string;
  price?: number | string;
  imageUrl?: string;
  category?: string;
  condition?: string;
};

const allowedConditions = new Set(["New", "Like New", "Good", "Fair"]);

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeRpcObject<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse("Unauthorized.", 401);
  }

  const { data, error } = await supabase.rpc("get_my_profile_backend");

  if (error) {
    return errorResponse(error.message);
  }

  const payload = (data ?? { postedItems: [] }) as ProfileItemsPayload;

  return NextResponse.json({ ok: true, postedItems: payload.postedItems ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse("Unauthorized.", 401);
  }

  const body = (await req.json().catch(() => null)) as CreateItemBody | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const condition =
    typeof body?.condition === "string" && allowedConditions.has(body.condition)
      ? body.condition
      : "Good";

  const price =
    typeof body?.price === "number"
      ? body.price
      : typeof body?.price === "string"
        ? Number(body.price)
        : Number.NaN;

  if (!name) {
    return errorResponse("Item name is required.");
  }

  if (!imageUrl) {
    return errorResponse("Provide an image URL for API item creation.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    return errorResponse("Price must be a positive number.");
  }

  const { data, error } = await supabase.rpc("post_my_item", {
    item_name: name,
    item_desc: description,
    item_price: price,
    item_url: imageUrl,
    item_category: category || null,
    item_condition: condition,
  });

  if (error) {
    return errorResponse(error.message);
  }

  const item = normalizeRpcObject(data);

  return NextResponse.json({ ok: true, item }, { status: 201 });
}
