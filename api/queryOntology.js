process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { label, tag, type } = req.body;

  let conditions = [];
  let values = [];
  let index = 1;

  if (label) {
    conditions.push(`lower(label) = lower($${index++})`);
    values.push(label);
  }

  if (tag) {
    conditions.push(`$${index++} = ANY(tags)`);
    values.push(tag);
  }

  if (type) {
    conditions.push(`type = $${index++}`);
    values.push(type);
  }

  const query = `
    select id, label, type, description, tags, data, created_at, updated_at
    from ontology_nodes
    ${conditions.length ? `where ${conditions.join(' and ')}` : ''}
    order by updated_at desc
    limit 10
  `;

  try {
    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();

    return res.status(200).json({ status: 'success', results: result.rows });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
