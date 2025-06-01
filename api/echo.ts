import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  res.status(200).json({
    method: req.method,
    headers: req.headers,
    raw: body,
    parsed: (() => {
      try {
        return JSON.parse(body);
      } catch {
        return "Invalid JSON";
      }
    })(),
  });
}
