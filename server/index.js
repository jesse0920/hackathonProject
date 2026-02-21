const express = require("express");
const { createHmac } = require("node:crypto");
const { randomInt } = require("node:crypto");

const app = express();
const PORT = process.env.PORT || 3001;
const spinProofSecret = process.env.SPIN_PROOF_SECRET || "";
const featherlessApiKey = process.env.FEATHERLESS_API_KEY || "";
const featherlessApiUrl = (process.env.FEATHERLESS_API_URL || "https://api.featherless.ai/v1").replace(/\/+$/, "");
const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

app.use(express.json());
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.header("Access-Control-Allow-Origin", requestOrigin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

function toItemId(value) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizeAngle(value) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createSpinProof(payload) {
  const serialized = JSON.stringify(payload);
  const payloadEncoded = toBase64Url(serialized);
  const signature = createHmac("sha256", spinProofSecret)
    .update(payloadEncoded)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${payloadEncoded}.${signature}`;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function cleanText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

app.get("/", (req, res) => {
  res.send("Express server is running.");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/pool/spin", (req, res) => {
  if (!spinProofSecret) {
    res.status(500).json({
      ok: false,
      error: "Spin proof secret is not configured on the spin service.",
    });
    return;
  }

  const requesterItemId = toItemId(req.body?.requesterItemId);
  const candidateRaw = Array.isArray(req.body?.candidateItemIds) ? req.body.candidateItemIds : [];
  const candidateItemIds = Array.from(
    new Set(
      candidateRaw
    .map((value) => toItemId(value))
        .filter((value) => !!value),
    ),
  );

  if (!requesterItemId) {
    res.status(400).json({ ok: false, error: "A valid requester item id is required." });
    return;
  }

  if (candidateItemIds.length < 1) {
    res.status(400).json({ ok: false, error: "At least one candidate item is required." });
    return;
  }

  const candidateCount = candidateItemIds.length;
  const winnerIndex = randomInt(candidateCount);
  const winnerItemId = candidateItemIds[winnerIndex];

  const segmentAngle = 360 / candidateCount;
  const edgeBuffer = Math.min(segmentAngle * 0.2, 3);
  const inSegmentMin = edgeBuffer;
  const inSegmentMax = Math.max(inSegmentMin, segmentAngle - edgeBuffer);
  const randomFloat = randomInt(0, 1_000_000) / 1_000_000;
  const randomOffsetInSegment = inSegmentMin + randomFloat * (inSegmentMax - inSegmentMin);
  const winnerAngle = winnerIndex * segmentAngle + randomOffsetInSegment;
  const targetAngle = normalizeAngle(360 - winnerAngle);

  const extraTurns = 360 * (6 + randomInt(5));
  const durationMs = 4200 + randomInt(1800);
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 60_000;
  const spinProof = createSpinProof({
    requesterItemId,
    winnerItemId,
    candidateItemIds,
    issuedAt,
    expiresAt,
  });

  res.status(200).json({
    ok: true,
    winnerItemId,
    winnerIndex,
    targetAngle,
    extraTurns,
    durationMs,
    spinProof,
  });
});

app.post("/ai/listing-assist", async (req, res) => {
  if (!featherlessApiKey) {
    res.status(503).json({
      ok: false,
      error: "AI assistant is not configured on the spin service.",
    });
    return;
  }

  const title = cleanText(req.body?.title, "");
  const description = cleanText(req.body?.description, "");
  const category = cleanText(req.body?.category, "Accessories");
  const condition = cleanText(req.body?.condition, "Good");
  const extraNotes = cleanText(req.body?.extraNotes, "");

  if (!title && !description && !extraNotes) {
    res.status(400).json({
      ok: false,
      error: "Provide at least a title, description, or extra notes.",
    });
    return;
  }

  const prompt = [
    "You are an item-listing assistant for a Las Vegas local swap app using virtual coin values.",
    "Return STRICT JSON only. No markdown.",
    "JSON schema:",
    "{",
    '  "improvedTitle": string,',
    '  "improvedDescription": string,',
    '  "suggestedCategory": "Sports"|"Clothing"|"Electronics"|"Accessories"|"Outdoor",',
    '  "suggestedCondition": "New"|"Like New"|"Good"|"Fair",',
    '  "recommendedCoins": number,',
    '  "estimatedMinCoins": number,',
    '  "estimatedMaxCoins": number,',
    '  "riskFlags": string[],',
    '  "safetyNote": string',
    "}",
    "Rules:",
    "- recommendedCoins, estimatedMinCoins, estimatedMaxCoins must be positive integers.",
    "- Ensure estimatedMinCoins <= recommendedCoins <= estimatedMaxCoins.",
    "- riskFlags should be short and practical.",
    "- Keep improvedDescription concise and factual.",
    "",
    "Input:",
    JSON.stringify({ title, description, category, condition, extraNotes }),
  ].join("\n");

  try {
    const response = await fetch(`${featherlessApiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${featherlessApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "moonshotai/Kimi-K2-Instruct",
        temperature: 0.3,
        messages: [
          { role: "system", content: "You output only strict JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      res.status(502).json({
        ok: false,
        error: payload?.error?.message || "AI provider request failed.",
      });
      return;
    }

    const content = payload?.choices?.[0]?.message?.content;
    const parsed = safeJsonParse(typeof content === "string" ? content : "");
    if (!parsed || typeof parsed !== "object") {
      res.status(502).json({
        ok: false,
        error: "AI response could not be parsed.",
      });
      return;
    }

    const allowedCategories = new Set(["Sports", "Clothing", "Electronics", "Accessories", "Outdoor"]);
    const allowedConditions = new Set(["New", "Like New", "Good", "Fair"]);
    const improvedTitle = cleanText(parsed.improvedTitle, title || "Untitled item");
    const improvedDescription = cleanText(parsed.improvedDescription, description || "No description provided.");
    const suggestedCategory = allowedCategories.has(parsed.suggestedCategory) ? parsed.suggestedCategory : category;
    const suggestedCondition = allowedConditions.has(parsed.suggestedCondition) ? parsed.suggestedCondition : condition;
    const recommendedCoins = Math.max(1, Math.round(Number(parsed.recommendedCoins) || 1));
    let estimatedMinCoins = Math.max(1, Math.round(Number(parsed.estimatedMinCoins) || recommendedCoins));
    let estimatedMaxCoins = Math.max(estimatedMinCoins, Math.round(Number(parsed.estimatedMaxCoins) || recommendedCoins));
    if (recommendedCoins < estimatedMinCoins) estimatedMinCoins = recommendedCoins;
    if (recommendedCoins > estimatedMaxCoins) estimatedMaxCoins = recommendedCoins;
    const riskFlags = Array.isArray(parsed.riskFlags)
      ? parsed.riskFlags.filter((value) => typeof value === "string").map((value) => value.trim()).filter((value) => value.length > 0).slice(0, 6)
      : [];
    const safetyNote = cleanText(parsed.safetyNote, "Meet in a public location and verify item condition before trade.");

    res.status(200).json({
      ok: true,
      suggestion: {
        improvedTitle,
        improvedDescription,
        suggestedCategory,
        suggestedCondition,
        recommendedCoins,
        estimatedMinCoins,
        estimatedMaxCoins,
        riskFlags,
        safetyNote,
      },
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: "AI assistant request failed. Try again.",
      detail: error?.message || String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
