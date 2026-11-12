import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("./.env.local", import.meta.url), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const key = env.AI_API_KEY;
const base = env.AI_API_BASE || "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1";
const model = env.AI_MODEL || "qwen3.6-flash";

if (!key) {
  console.error("AI_API_KEY is missing from .env.local");
  process.exit(1);
}

function parseModelJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("The model did not return JSON.");
  return JSON.parse(raw.slice(start, end + 1));
}

async function rank(body) {
  const plates = Array.isArray(body.plates) ? body.plates.slice(0, 24) : [];
  const allowed = new Set(plates.map((plate) => String(plate.id)));
  const brief = plates.map((plate) => ({
    id: plate.id,
    title: plate.title,
    summary: plate.summary,
    calories: plate.calories,
    protein: plate.protein,
    fat: plate.fat,
    carbs: plate.carbs,
    libraryScore: plate.libraryScore,
    reasons: plate.reasons,
  }));

  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "You rank meals from a fixed library. Return only JSON with keys recommendation (one short paragraph) and scores (array of {id, score, reason}). Use only the given ids. Score from 0 to 100 for how well the plate fits the request. Do not invent dishes, calories, or other nutrition numbers. The nutrition in the list is already calculated.",
        },
        {
          role: "user",
          content: `Request: ${String(body.query || "a suitable meal").slice(0, 500)}\nPlates:\n${JSON.stringify(brief)}`,
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || `Model request failed (${response.status})`;
    throw new Error(message);
  }
  const content = payload?.choices?.[0]?.message?.content || "";
  const parsed = parseModelJson(content);
  const scores = Array.isArray(parsed.scores) ? parsed.scores : [];
  return {
    model,
    recommendation: String(parsed.recommendation || "").slice(0, 600),
    scores: scores
      .filter((item) => allowed.has(String(item.id)))
      .map((item) => ({
        id: String(item.id),
        score: Math.max(0, Math.min(100, Math.round(Number(item.score) || 0))),
        reason: String(item.reason || "").slice(0, 240),
      })),
  };
}

const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }
  if (request.method !== "POST" || request.url !== "/ai") {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }
  try {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    const result = await rank(body);
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(result));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    response.writeHead(502, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Model request failed" }));
  }
});

server.listen(4722, "127.0.0.1", () => {
  console.log(`AI rank server on http://127.0.0.1:4722/ai using ${model}`);
});
