import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AuthMode = "login" | "register";

type AuthRequestBody = {
  mode?: AuthMode;
  email?: string;
  password?: string;
  name?: string;
  username?: string;
};

function deriveUsername(email: string) {
  return email.split("@")[0]?.trim().slice(0, 32) || "player";
}

function normalizeDisplayName(input: string | undefined, email: string) {
  const base = (input?.trim() || deriveUsername(email)).slice(0, 64);
  const withoutAt = base.replace(/@/g, " ");
  const safe = withoutAt.replace(/[^a-zA-Z0-9 _.-]/g, "").trim();
  return safe || deriveUsername(email);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = (await req.json().catch(() => null)) as AuthRequestBody | null;

  // Debug: log a masked representation of the incoming body and content-type
  try {
    const contentType = req.headers.get("content-type");
    const safeBody = body
      ? {
          ...body,
          password: body.password ? "[REDACTED]" : undefined,
        }
      : null;
    // Use console.debug so this is easy to find in dev logs
    console.debug("[auth] Incoming request", { contentType, body: safeBody });
  } catch (e) {
    // ignore logging errors
  }

  if (!body?.mode || !body.email || !body.password) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (body.mode !== "login" && body.mode !== "register") {
    return NextResponse.json({ error: "Invalid auth mode." }, { status: 400 });
  }

  if (body.password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  const suppliedName = body.name ?? body.username;

  if (body.mode === "register" && suppliedName && suppliedName.trim().length < 3) {
    return NextResponse.json(
      { error: "Name must be at least 3 characters." },
      { status: 400 },
    );
  }

  if (body.mode === "login") {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const user = data.user;

    if (user) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          name: deriveUsername(body.email),
          wins: 0,
          totalBets: 0,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      if (profileError) {
        console.error("[auth] profile upsert failed on login", profileError);
      }
    }

    return NextResponse.json({ ok: true, message: "Logged in.", redirectTo: "/profile" });
  }

  const name = normalizeDisplayName(suppliedName, body.email);
  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      data: {
        name,
        username: name,
      },
    },
  });

  if (error) {
    console.error("[auth] signUp failed", {
      message: error.message,
      name: error.name,
      status: (error as { status?: number }).status,
      code: (error as { code?: string }).code,
      normalizedName: name,
    });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // If email confirmation is disabled, a session exists immediately and we can safely write profile now.
  if (data.user && data.session) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        name,
        wins: 0,
        totalBets: 0,
      },
      { onConflict: "id" },
    );
    if (profileError) {
      console.error("[auth] profile upsert failed on register", profileError);
    }

    return NextResponse.json({
      ok: true,
      message: "Account created.",
      // Show client-only onboarding immediately after a successful signup/session
      redirectTo: "/onboarding",
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Check your email to confirm registration.",
    redirectTo: "/login",
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Signed out." });
}
