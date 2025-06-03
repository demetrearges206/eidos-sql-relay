process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { source_id, target_id, relation, source_type, target_type } = req.body;

  let conditions = [];
  let values = [];
  let index = 1;

  if (source_id) {
    conditions.push(`source_id = $${index++}`);
    values.push(source_id);
  }

  if (target_id) {
    conditions.push(`target_id = $${index++}`);
    values.push(target_id);
  }

  if (relation) {
    conditions.push(`relation = $${index++}`);
    values.push(relation);
  }

  if (source_type) {
    conditions.push(`source_type = $${index++}`);
    values.push(source_type);
  }

  if (target_type) {
    conditions.push(`target_type = $${index++}`);
    values.push(target_type);
  }

  const query = `
    select *
    from codex_links
    ${conditions.length ? `where ${conditions.join(' and ')}` : ''}
    order by created_at desc
    limit 10
  `;

  try {
    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();

    return res.status(200).json({ status: 'success', links: result.rows });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
