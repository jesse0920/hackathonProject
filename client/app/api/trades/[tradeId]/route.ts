import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type TradeRow = {
  trade_id: number;
  requester_id: string;
  recipient_id: string;
  requester_approved: boolean;
  recipient_approved: boolean;
  status: string;
};

type TradeActionBody = {
  action?: "accept" | "decline" | "cancel" | "complete";
};

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseTradeId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse("Unauthorized.", 401);
  }

  const { tradeId: tradeIdRaw } = await params;
  const tradeId = parseTradeId(tradeIdRaw);
  if (!tradeId) {
    return errorResponse("Invalid trade id.");
  }

  const body = (await req.json().catch(() => null)) as TradeActionBody | null;
  const action = body?.action;

  if (!action) {
    return errorResponse("action is required.");
  }

  const { data: trade, error: tradeError } = await supabase
    .from("trade_requests")
    .select("trade_id, requester_id, recipient_id, requester_approved, recipient_approved, status")
    .eq("trade_id", tradeId)
    .maybeSingle();

  if (tradeError) {
    return errorResponse(tradeError.message);
  }

  const tradeRow = trade as TradeRow | null;

  if (!tradeRow) {
    return errorResponse("Trade not found.", 404);
  }

  const isRequester = tradeRow.requester_id === user.id;
  const isRecipient = tradeRow.recipient_id === user.id;

  if (!isRequester && !isRecipient) {
    return errorResponse("Forbidden.", 403);
  }

  if (action === "accept") {
    if (tradeRow.status !== "pending") {
      return errorResponse("Only pending trades can be accepted.");
    }

    const requesterApproved = isRequester ? true : tradeRow.requester_approved;
    const recipientApproved = isRecipient ? true : tradeRow.recipient_approved;
    const nextStatus = requesterApproved && recipientApproved ? "accepted" : "pending";

    const { data, error } = await supabase
      .from("trade_requests")
      .update({
        requester_approved: requesterApproved,
        recipient_approved: recipientApproved,
        status: nextStatus,
      })
      .eq("trade_id", tradeId)
      .select("trade_id, status, requester_approved, recipient_approved, meetup_location")
      .maybeSingle();

    if (error) {
      return errorResponse(error.message);
    }

    return NextResponse.json({ ok: true, trade: data });
  }

  if (action === "decline") {
    if (tradeRow.status !== "pending") {
      return errorResponse("Only pending trades can be declined.");
    }

    const { data, error } = await supabase
      .from("trade_requests")
      .update({
        status: "declined",
        declined_by: user.id,
      })
      .eq("trade_id", tradeId)
      .select("trade_id, status, declined_by")
      .maybeSingle();

    if (error) {
      return errorResponse(error.message);
    }

    return NextResponse.json({ ok: true, trade: data });
  }

  if (action === "cancel") {
    if (!isRequester) {
      return errorResponse("Only the trade requester can cancel.", 403);
    }

    if (tradeRow.status !== "pending") {
      return errorResponse("Only pending trades can be cancelled.");
    }

    const { data, error } = await supabase
      .from("trade_requests")
      .update({
        status: "cancelled",
      })
      .eq("trade_id", tradeId)
      .select("trade_id, status")
      .maybeSingle();

    if (error) {
      return errorResponse(error.message);
    }

    return NextResponse.json({ ok: true, trade: data });
  }

  if (action === "complete") {
    if (tradeRow.status !== "accepted") {
      return errorResponse("Only accepted trades can be completed.");
    }

    const { data, error } = await supabase
      .from("trade_requests")
      .update({
        status: "completed",
      })
      .eq("trade_id", tradeId)
      .select("trade_id, status")
      .maybeSingle();

    if (error) {
      return errorResponse(error.message);
    }

    return NextResponse.json({ ok: true, trade: data });
  }

  return errorResponse("Unsupported action.");
}
