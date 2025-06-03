
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require', ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { label, summary } = req.body;
  if (!label || !summary) return res.status(400).json({ error: 'Missing label or summary' });

  const query = `
    update codex_modules
    set content = jsonb_set(coalesce(content, '{}'), '{summary}', to_jsonb($1::text)),
        updated_at = now()
    where label = $2
    returning id, label, content;
  `;

  try {
    const client = await pool.connect();
    const result = await client.query(query, [summary, label]);
    client.release();
    return res.status(200).json({ status: 'success', result: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
