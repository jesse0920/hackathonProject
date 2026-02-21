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

function normalizeDisplayName(input: string) {
  const base = input.trim().slice(0, 64);
  const withoutAt = base.replace(/@/g, " ");
  const safe = withoutAt.replace(/[^a-zA-Z0-9 _.-]/g, "").trim();
  return safe;
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

  const suppliedName = (body.name ?? body.username ?? "").trim();
  const normalizedName = normalizeDisplayName(suppliedName);
  if (!normalizedName || normalizedName.length < 3) {
    return NextResponse.json(
      { error: "Username must be at least 3 valid characters." },
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
      const { data: existingProfile, error: profileReadError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileReadError) {
        console.error("[auth] profile read failed on login", profileReadError);
      } else if (existingProfile) {
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ name: normalizedName })
          .eq("id", user.id);

        if (profileUpdateError) {
          console.error("[auth] profile update failed on login", profileUpdateError);
        }
      } else {
        const { error: profileInsertError } = await supabase.from("profiles").insert({
          id: user.id,
          name: normalizedName,
          wins: 0,
          totalBets: 0,
        });

        if (profileInsertError) {
          console.error("[auth] profile insert failed on login", profileInsertError);
        }
      }
    }

    return NextResponse.json({ ok: true, message: "Logged in.", redirectTo: "/profile" });
  }

  const name = normalizedName;
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
      redirectTo: "/profile",
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
