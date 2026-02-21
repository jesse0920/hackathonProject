import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfileReceivedPayload = {
  receivedItems: unknown[];
};

type AddReceivedBody = {
  itemId?: string | number;
  senderId?: string | null;
  note?: string | null;
};

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
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

  const payload = (data ?? { receivedItems: [] }) as ProfileReceivedPayload;

  return NextResponse.json({ ok: true, receivedItems: payload.receivedItems ?? [] });
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

  const body = (await req.json().catch(() => null)) as AddReceivedBody | null;
  const itemId = body?.itemId;
  const senderId =
    typeof body?.senderId === "string" ? body.senderId.trim() : body?.senderId;
  const note = typeof body?.note === "string" ? body.note.trim() : null;

  if (itemId === undefined || itemId === null || `${itemId}`.trim() === "") {
    return errorResponse("itemId is required.");
  }

  if (typeof senderId === "string" && senderId.length > 0 && !isUuid(senderId)) {
    return errorResponse("senderId must be a valid UUID.");
  }

  const { data, error } = await supabase.rpc("add_received_item", {
    received_item_id: String(itemId),
    from_profile_id:
      typeof senderId === "string" && senderId.length > 0 ? senderId : null,
    received_note: note && note.length > 0 ? note : null,
  });

  if (error) {
    return errorResponse(error.message);
  }

  const receipt = normalizeRpcObject(data);

  return NextResponse.json({ ok: true, receipt }, { status: 201 });
}
