
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
      case 'queryCodex': {
        const { label, id } = payload;
        if (!label && !id) throw new Error('Missing label or id');
        const q = `select * from codex_modules where ${label ? "label = $1" : "id = $1"} limit 1`;
        const r = await client.query(q, [label || id]);
        client.release();
        return res.status(200).json({ status: 'success', module: r.rows[0] });
      }

      case 'synthesizeCodex': {
        const { labels = [], ids = [] } = payload;
        if (!labels.length && !ids.length) throw new Error('No identifiers provided');
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

        const q = `
          select label, description, type, tags, version, updated_at
          from codex_modules
          where ${conditions.join(' or ')}
          order by updated_at desc
          limit 10
        `;
        const r = await client.query(q, values);
        client.release();
        const synthesis = r.rows.map(row => ({
          label: row.label,
          type: row.type,
          version: row.version,
          summary: row.description,
          tags: row.tags,
          updated_at: row.updated_at
        }));
        return res.status(200).json({ status: 'success', synthesis });
      }

      default:
        client.release();
        return res.status(400).json({ error: 'Unknown codex type' });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
