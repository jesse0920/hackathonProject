import { NextResponse } from "next/server";
import { getValueTier } from "@/lib/value-tier";
import { createClient } from "@/lib/supabase/server";

type TradeCreateBody = {
  requesterItemId?: number | string;
  recipientItemId?: number | string;
};

type TradeRow = {
  trade_id: number;
  requester_id: string;
  recipient_id: string;
  requester_item_id: number;
  recipient_item_id: number;
  requester_approved: boolean;
  recipient_approved: boolean;
  status: string;
  meetup_location: string | null;
  created_at: string;
  updated_at: string;
  declined_by: string | null;
};

type ItemRow = {
  item_id: number;
  name: string;
  price: number;
  url: string | null;
  category: string | null;
  condition: string | null;
  user_id: string;
};

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function toItemId(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
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

  const { data: tradeRowsRaw, error: tradeError } = await supabase
    .from("trade_requests")
    .select("trade_id, requester_id, recipient_id, requester_item_id, recipient_item_id, requester_approved, recipient_approved, status, meetup_location, created_at, updated_at, declined_by")
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (tradeError) {
    return errorResponse(tradeError.message);
  }

  const tradeRows = (tradeRowsRaw ?? []) as TradeRow[];

  if (tradeRows.length === 0) {
    return NextResponse.json({ ok: true, currentUserId: user.id, trades: [] });
  }

  const itemIds = Array.from(
    new Set(
      tradeRows
        .flatMap((row) => [row.requester_item_id, row.recipient_item_id])
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
  const profileIds = Array.from(new Set(tradeRows.flatMap((row) => [row.requester_id, row.recipient_id])));

  const [{ data: itemRowsRaw }, { data: profileRowsRaw }] = await Promise.all([
    itemIds.length > 0
      ? supabase.from("items").select("item_id, name, price, url, category, condition, user_id").in("item_id", itemIds)
      : Promise.resolve({ data: [] as ItemRow[] }),
    profileIds.length > 0
      ? supabase.rpc("get_profile_names", { profile_ids: profileIds })
      : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
  ]);

  const itemRows = (itemRowsRaw ?? []) as ItemRow[];
  const profileRows = (profileRowsRaw ?? []) as { id: string; name: string | null }[];

  const itemById = new Map(itemRows.map((item) => [item.item_id, item]));
  const profileNameById = new Map(
    profileRows.map((profile) => [profile.id, (profile.name || "Player").trim() || "Player"]),
  );

  const trades = tradeRows.map((trade) => ({
    tradeId: trade.trade_id,
    status: trade.status,
    requesterApproved: trade.requester_approved,
    recipientApproved: trade.recipient_approved,
    meetupLocation: trade.meetup_location || "Central PD",
    createdAt: trade.created_at,
    updatedAt: trade.updated_at,
    declinedBy: trade.declined_by,
    requester: {
      id: trade.requester_id,
      name: profileNameById.get(trade.requester_id) ?? "Player",
    },
    recipient: {
      id: trade.recipient_id,
      name: profileNameById.get(trade.recipient_id) ?? "Player",
    },
    requesterItem: itemById.get(trade.requester_item_id) || null,
    recipientItem: itemById.get(trade.recipient_item_id) || null,
  }));

  return NextResponse.json({ ok: true, currentUserId: user.id, trades });
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

  const body = (await req.json().catch(() => null)) as TradeCreateBody | null;
  const requesterItemId = toItemId(body?.requesterItemId);
  const recipientItemId = toItemId(body?.recipientItemId);

  if (!requesterItemId || !recipientItemId) {
    return errorResponse("Both requesterItemId and recipientItemId are required.");
  }

  if (requesterItemId === recipientItemId) {
    return errorResponse("You must select two different items.");
  }

  const { data: itemRowsRaw, error: itemError } = await supabase
    .from("items")
    .select("item_id, name, price, url, category, condition, user_id")
    .in("item_id", [requesterItemId, recipientItemId]);

  if (itemError) {
    return errorResponse(itemError.message);
  }

  const itemRows = (itemRowsRaw ?? []) as ItemRow[];

  if (itemRows.length !== 2) {
    return errorResponse("One or both items do not exist.");
  }

  const requesterItem = itemRows.find((item) => item.item_id === requesterItemId);
  const recipientItem = itemRows.find((item) => item.item_id === recipientItemId);

  if (!requesterItem || !recipientItem) {
    return errorResponse("Could not resolve selected items.");
  }

  if (requesterItem.user_id !== user.id) {
    return errorResponse("You can only gamble with your own selected item.", 403);
  }

  if (recipientItem.user_id === user.id) {
    return errorResponse("You must land on another user's item.", 403);
  }

  if (getValueTier(Number(requesterItem.price)) !== getValueTier(Number(recipientItem.price))) {
    return errorResponse("Items must be in the same value bracket.");
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("trade_requests")
    .insert({
      requester_id: user.id,
      recipient_id: recipientItem.user_id,
      requester_item_id: requesterItem.item_id,
      recipient_item_id: recipientItem.item_id,
      requester_approved: true,
      recipient_approved: false,
      status: "pending",
      meetup_location: "Central PD",
    })
    .select("trade_id, status, meetup_location")
    .limit(1);

  if (insertError) {
    return errorResponse(insertError.message);
  }

  const trade = insertedRows?.[0] ?? null;

  return NextResponse.json(
    {
      ok: true,
      trade,
      message: "Trade request created. Waiting for the other user to agree.",
    },
    { status: 201 },
  );
}
