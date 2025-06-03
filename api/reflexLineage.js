
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require', ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { label } = req.body;
  if (!label) return res.status(400).json({ error: 'Missing label' });

  const query = `
    select label, version, author_id, updated_by, updated_at
    from codex_modules
    where label = $1
    order by updated_at desc
    limit 10
  `;

  try {
    const client = await pool.connect();
    const result = await client.query(query, [label]);
    client.release();
    return res.status(200).json({ status: 'success', lineage: result.rows });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
