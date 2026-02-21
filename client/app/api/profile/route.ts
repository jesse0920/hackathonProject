import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfileBackendPayload = {
  profile: Record<string, unknown> | null;
  postedItems: unknown[];
  receivedItems: unknown[];
};

type ProfilePatchBody = {
  name?: string;
};

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

  const fallback: ProfileBackendPayload = {
    profile: null,
    postedItems: [],
    receivedItems: [],
  };
  const payload = (data ?? fallback) as ProfileBackendPayload;

  return NextResponse.json({ ok: true, ...payload });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse("Unauthorized.", 401);
  }

  const body = (await req.json().catch(() => null)) as ProfilePatchBody | null;
  const rawName = typeof body?.name === "string" ? body.name : "";
  const name = rawName.trim();

  if (name.length < 3) {
    return errorResponse("Name must be at least 3 characters.");
  }

  const { data, error } = await supabase.rpc("set_my_profile_name", {
    input_name: name,
  });

  if (error) {
    return errorResponse(error.message);
  }

  const profile = normalizeRpcObject(data);

  return NextResponse.json({ ok: true, profile });
}
