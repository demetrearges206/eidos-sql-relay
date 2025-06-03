process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { labels = [], ids = [] } = req.body;

  if (!labels.length && !ids.length) {
    return res.status(400).json({ error: 'No identifiers provided' });
  }

  const conditions = [];
  const values = [];
  let index = 1;

  if (labels.length) {
    conditions.push(`label = ANY($${index})`);
    values.push(labels);
    index++;
  }

  if (ids.length) {
    conditions.push(`id = ANY($${index})`);
    values.push(ids);
  }

  const query = `
    select label, description, type, tags, version, updated_at
    from codex_modules
    where ${conditions.join(' or ')}
    order by updated_at desc
    limit 10
  `;

  try {
    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();

    const synthesis = result.rows.map(row => ({
      label: row.label,
      type: row.type,
      version: row.version,
      summary: row.description,
      tags: row.tags,
      updated_at: row.updated_at
    }));

    return res.status(200).json({ status: 'success', synthesis });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
