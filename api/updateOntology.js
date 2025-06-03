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
    type,
    description,
    tags = [],
    data = {}
  } = req.body;

  if (!label) {
    return res.status(400).json({ error: 'Missing required field: label' });
  }

  const upsertQuery = `
    insert into ontology_nodes (label, type, description, tags, data, created_at, updated_at)
    values ($1, $2, $3, $4, $5, now(), now())
    on conflict (label) do update set
      type = coalesce($2, ontology_nodes.type),
      description = coalesce($3, ontology_nodes.description),
      tags = array_cat(ontology_nodes.tags, $4),
      data = ontology_nodes.data || $5,
      updated_at = now()
    returning id, label, updated_at
  `;

  const values = [label, type, description, tags, data];

  try {
    const client = await pool.connect();
    const result = await client.query(upsertQuery, values);
    client.release();

    return res.status(200).json({ status: 'success', node: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
