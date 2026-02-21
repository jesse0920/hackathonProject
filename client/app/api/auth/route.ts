import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getOnboardedState, ONBOARDED_COOKIE } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

type AuthMode = "login" | "register";

type AuthRequestBody = {
  mode?: AuthMode;
  identifier?: string;
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

function isEmailLike(value: string) {
  return value.includes("@");
}

async function resolveLoginEmail(identifier: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  if (isEmailLike(identifier)) {
    return identifier;
  }

  const normalizedName = normalizeDisplayName(identifier);
  if (!normalizedName || normalizedName.length < 3) {
    return null;
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("name", normalizedName)
    .limit(1);

  if (profileError) {
    console.error("[auth] profile lookup failed on username login", profileError);
    return null;
  }

  const profile = profileRows?.[0];
  const userId = profile?.id;
  if (!userId) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[auth] SUPABASE_SERVICE_ROLE_KEY missing; username login unavailable.");
    return null;
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userLookup, error: userLookupError } = await admin.auth.admin.getUserById(userId);
  if (userLookupError) {
    console.error("[auth] admin user lookup failed on username login", userLookupError);
    return null;
  }

  return userLookup.user?.email ?? null;
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

  if (!body?.mode || !body.password) {
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
  if (body.mode === "register" && (!normalizedName || normalizedName.length < 3)) {
    return NextResponse.json(
      { error: "Username must be at least 3 valid characters." },
      { status: 400 },
    );
  }

  if (body.mode === "login") {
    const rawIdentifier = (body.identifier ?? body.email ?? body.username ?? "").trim();
    if (!rawIdentifier) {
      return NextResponse.json({ error: "Enter your username or email." }, { status: 400 });
    }

    const resolvedEmail = await resolveLoginEmail(rawIdentifier, supabase);
    if (!resolvedEmail) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
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
        if (normalizedName && normalizedName.length >= 3) {
          const { error: profileUpdateError } = await supabase
            .from("profiles")
            .update({ name: normalizedName })
            .eq("id", user.id);

          if (profileUpdateError) {
            console.error("[auth] profile update failed on login", profileUpdateError);
          }
        }
      } else {
        const fallbackName =
          (normalizedName && normalizedName.length >= 3
            ? normalizedName
            : normalizeDisplayName(user.user_metadata?.name || user.email?.split("@")[0] || "Player")) || "Player";
        const { error: profileInsertError } = await supabase.from("profiles").insert({
          id: user.id,
          name: fallbackName,
          wins: 0,
          totalBets: 0,
        });

        if (profileInsertError) {
          console.error("[auth] profile insert failed on login", profileInsertError);
        }
      }
    }

    const onboarding = await getOnboardedState(supabase, user.id);
    const onboarded = onboarding.error ? false : onboarding.onboarded;
    const response = NextResponse.json({
      ok: true,
      message: "Logged in.",
      redirectTo: onboarded ? "/profile" : "/onboarding",
    });
    if (onboarded) {
      response.cookies.set(ONBOARDED_COOKIE, "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    } else {
      response.cookies.delete(ONBOARDED_COOKIE);
    }
    return response;
  }

  const name = normalizedName;
  if (!body.email) {
    return NextResponse.json({ error: "Email is required for registration." }, { status: 400 });
  }

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

    const response = NextResponse.json({
      ok: true,
      message: "Account created.",
      redirectTo: "/onboarding",
    });
    response.cookies.delete(ONBOARDED_COOKIE);
    return response;
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

  const response = NextResponse.json({ ok: true, message: "Signed out." });
  response.cookies.delete(ONBOARDED_COOKIE);
  return response;
}
