process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const resolveIntent = (intent) => {
  const lowered = intent.toLowerCase();

  if (lowered.includes('phase 3') && lowered.includes('status')) {
    return {
      action: 'status_update',
      sql: `
        update codex_modules
        set status = 'complete', updated_at = now()
        where lower(label) like '%phase 3%' or lower(description) like '%phase 3%'
      `
    };
  }

  if (lowered.includes('tag') && lowered.includes('relay_identity_reflex')) {
    return {
      action: 'add_tag',
      sql: `
        update codex_modules
        set tags = array_append(tags, 'vital'), updated_at = now()
        where label ilike '%relay_identity_reflex%'
      `
    };
  }

  return null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { intent } = req.body;
  if (!intent) return res.status(400).json({ error: 'Missing intent' });

  const intentResolved = resolveIntent(intent);
  if (!intentResolved) {
    return res.status(400).json({ error: 'Unrecognized intent' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(intentResolved.sql);
    client.release();

    return res.status(200).json({
      status: 'success',
      affected: result.rowCount,
      action: intentResolved.action
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
