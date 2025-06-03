process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL + '?sslmode=require', ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { type, payload } = req.body;
  if (!type || !payload) return res.status(400).json({ error: 'Missing type or payload' });

  try {
    const client = await pool.connect();

    switch (type) {
      case 'writeSummary': {
        const { label, summary } = payload;
        if (!label || !summary) throw new Error('Missing label or summary');
        const q = `
          update codex_modules
          set content = jsonb_set(coalesce(content, '{}'), '{summary}', to_jsonb($1::text)),
              updated_at = now()
          where label = $2
          returning id, label, content;
        `;
        const r = await client.query(q, [summary, label]);
        client.release();
        return res.status(200).json({ status: 'success', result: r.rows[0] });
      }

      case 'queryCodex': {
        const { label, id } = payload;
        if (!label && !id) throw new Error('Missing label or id');
        const q = `select * from codex_modules where ${label ? "label = $1" : "id = $1"} limit 1`;
        const r = await client.query(q, [label || id]);
        client.release();
        return res.status(200).json({ status: 'success', module: r.rows[0] });
      }

      case 'listCodexByTag': {
        const { tag } = payload;
        if (!tag) throw new Error('Missing tag');
        const q = `select * from codex_modules where $1 = any(tags) order by updated_at desc limit 20`;
        const r = await client.query(q, [tag]);
        client.release();
        return res.status(200).json({ status: 'success', modules: r.rows });
      }

      case 'reflexLineage': {
        const { label } = payload;
        if (!label) throw new Error('Missing label');
        const q = `
          select label, version, author_id, updated_by, updated_at
          from codex_modules where label = $1 order by updated_at desc limit 10
        `;
        const r = await client.query(q, [label]);
        client.release();
        return res.status(200).json({ status: 'success', lineage: r.rows });
      }

      case 'triggerHeartbeat': {
        client.release();
        return res.status(200).json({
          status: 'success',
          message: `Heartbeat triggered at ${new Date().toISOString()}`
        });
      }

      default:
        client.release();
        return res.status(400).json({ error: 'Unknown type' });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
