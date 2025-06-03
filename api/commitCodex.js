process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const {
    label,
    version,
    type,
    content_full,
    status = 'active',
    description = '',
    tags = [],
    context = '',
    metadata = {}
  } = req.body;

  if (!label || !type || !content_full) {
    return res.status(400).json({ error: 'Missing required fields: label, type, content_full' });
  }

  const query = `
    insert into codex_modules (
      label, version, type, content_full, status, created_at,
      description, tags, context, metadata
    ) values (
      $1, $2, $3, $4, $5, now(), $6, $7, $8, $9
    )
    returning id, label, created_at
  `;

  const values = [
    label,
    version,
    type,
    content_full,
    status,
    description,
    tags,
    context,
    metadata
  ];

  try {
    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();
    res.status(200).json({ status: 'success', codex: result.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
