import { NextResponse } from "next/server";

type ListingAssistBody = {
  title?: string;
  description?: string;
  category?: string;
  condition?: string;
  extraNotes?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  const spinServiceUrl = (process.env.SPIN_SERVICE_URL || "http://127.0.0.1:3001").replace(/\/+$/, "");
  const body = (await req.json().catch(() => null)) as ListingAssistBody | null;

  const payload: ListingAssistBody = {
    title: cleanText(body?.title),
    description: cleanText(body?.description),
    category: cleanText(body?.category),
    condition: cleanText(body?.condition),
    extraNotes: cleanText(body?.extraNotes),
  };

  if (!payload.title && !payload.description && !payload.extraNotes) {
    return NextResponse.json(
      { ok: false, error: "Provide title, description, or extra notes." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${spinServiceUrl}/ai/listing-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const upstreamPayload = await upstream.json().catch(() => ({}));
    return NextResponse.json(upstreamPayload, { status: upstream.status });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "AI proxy request failed. Check SPIN_SERVICE_URL and spin service status.",
      },
      { status: 502 },
    );
  }
}
