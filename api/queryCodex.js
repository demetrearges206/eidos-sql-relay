
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require', ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { label, id } = req.body;
  if (!label && !id) return res.status(400).json({ error: 'Missing label or id' });

  const query = `
    select * from codex_modules
    where ${label ? "label = $1" : "id = $1"}
    limit 1
  `;

  try {
    const client = await pool.connect();
    const result = await client.query(query, [label || id]);
    client.release();
    return res.status(200).json({ status: 'success', module: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
