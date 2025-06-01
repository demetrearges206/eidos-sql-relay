import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const query = req.body;

    if (typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Empty SQL query received' });
    }

    const baseUrl = process.env.SUPABASE_URL?.trim();
    if (!baseUrl || !baseUrl.startsWith('http')) {
      throw new Error("SUPABASE_URL is missing or malformed.");
    }

    const functionUrl = baseUrl.replace('.supabase.co', '.functions.supabase.co') + '/functions/v1/run-sql';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: query
    });

    const result = await response.json();
    return res.status(response.ok ? 200 : 500).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: 'Relay failed', detail: err.message });
  }
}
