import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false, // Allow raw text body
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Read raw text body
  let query = '';
  for await (const chunk of req) {
    query += chunk;
  }

  query = query.trim();

  if (!query) {
    return res.status(400).json({ error: 'Missing SQL query in body.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing environment variables.' });
  }

  try {
const response = await fetch(`${SUPABASE_URL}/functions/v1/run-sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: query,  // ✅ raw SQL string, not JSON-wrapped
});
    
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to forward SQL to Supabase',
      detail: err.message,
    });
  }
}
