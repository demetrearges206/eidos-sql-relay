process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const {
    source_id,
    source_type,
    target_id,
    target_type,
    relation,
    data = {}
  } = req.body;

  if (!source_id || !target_id || !relation || !source_type || !target_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const insertQuery = `
    insert into codex_links (
      source_id, target_id, source_type, target_type, relation, data, created_at
    ) values ($1, $2, $3, $4, $5, $6, now())
    returning id, relation, created_at
  `;

  const values = [source_id, target_id, source_type, target_type, relation, data];

  try {
    const client = await pool.connect();
    const result = await client.query(insertQuery, values);
    client.release();

    return res.status(200).json({ status: 'success', link: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
