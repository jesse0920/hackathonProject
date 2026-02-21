import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = userData.user;

  const { error } = await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);

  if (error) {
    console.error("[onboarding] failed to update profile", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Optional: allow read checks
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ onboarded: false });
  const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", userData.user.id).limit(1).single();
  return NextResponse.json({ onboarded: profile?.onboarded ?? false });
}
