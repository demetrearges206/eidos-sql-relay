import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

const { query } = parsed;

if (!query || typeof query !== "string") {
  return res.status(400).json({ error: "Invalid or missing SQL query." });
}
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing environment variables." });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/run-sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      },
body: JSON.stringify({ query: query }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({
      error: "Failed to forward SQL to Supabase",
      detail: err.message,
    });
  }
}
