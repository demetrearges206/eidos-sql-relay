process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { intent } = req.body;
  if (!intent) return res.status(400).json({ error: 'Missing intent' });

  // TODO: Plug in a smarter resolver here
  // For now, use simple pattern matching or static test case
  if (intent.includes('Phase 3') && intent.includes('status')) {
    const updateQuery = `
      update codex_modules
      set status = 'complete', updated_at = now()
      where label ilike '%phase_3%' or description ilike '%Phase 3%'
    `;

    try {
      const client = await pool.connect();
      const result = await client.query(updateQuery);
      client.release();

      return res.status(200).json({
        status: 'success',
        affected: result.rowCount,
        action: 'status update'
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  return res.status(400).json({ error: 'Unrecognized intent' });
}
