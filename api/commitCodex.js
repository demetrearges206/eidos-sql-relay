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
    description,
    type,
    tags = [],
    content = {},
    version = '1.0',
    author_id,
    updated_by
  } = req.body;

  if (!label) return res.status(400).json({ error: 'Missing required field: label' });

  const query = `
    insert into codex_modules (
      label, description, type, tags, content, version, author_id, updated_by, created_at, updated_at
    ) values (
      $1, $2, $3, $4, $5, $6, $7, $8, now(), now()
    )
    on conflict (label) do update set
      description = coalesce($2, codex_modules.description),
      type = coalesce($3, codex_modules.type),
      tags = array_cat(codex_modules.tags, $4),
      content = $5,
      version = $6,
      updated_by = $8,
      updated_at = now()
    returning id, label, version, updated_at;
  `;

  const values = [label, description, type, tags, content, version, author_id, updated_by];

  try {
    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();

    return res.status(200).json({ status: 'success', module: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
