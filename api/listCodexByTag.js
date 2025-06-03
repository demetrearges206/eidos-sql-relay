
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require', ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { tag } = req.body;
  if (!tag) return res.status(400).json({ error: 'Missing tag' });

  const query = `
    select * from codex_modules
    where $1 = any(tags)
    order by updated_at desc
    limit 20
  `;

  try {
    const client = await pool.connect();
    const result = await client.query(query, [tag]);
    client.release();
    return res.status(200).json({ status: 'success', modules: result.rows });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
