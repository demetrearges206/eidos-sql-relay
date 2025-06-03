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
      case 'sql': {
        const { query } = payload;
        if (!query) throw new Error('Missing SQL query');
        const result = await client.query(query);
        client.release();
        return res.status(200).json({ status: 'success', results: result.rows, affected: result.rowCount, action: 'sql' });
      }

      case 'commitCodex': {
        const {
          label, description, type, tags = [], content = {}, content_full = {},
          version = '1.0', author_id, updated_by
        } = payload;
        if (!label) throw new Error('Missing label');
        const q = `
          insert into codex_modules (
            label, description, type, tags, content, content_full, version,
            author_id, updated_by, created_at, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, now(), now()
          )
          on conflict (label) do update set
            description = excluded.description,
            type = excluded.type,
            tags = array_cat(codex_modules.tags, excluded.tags),
            content = excluded.content,
            content_full = excluded.content_full,
            version = excluded.version,
            updated_by = excluded.updated_by,
            updated_at = now()
          returning id, label, version, updated_at;
        `;
        const v = [label, description, type, tags, content, content_full, version, author_id, updated_by];
        const result = await client.query(q, v);
        client.release();
        return res.status(200).json({ status: 'success', module: result.rows[0] });
      }

      case 'queryLinks': {
        const { source_id, target_id } = payload;
        const q = `
          select * from ontology_links
          where ($1::uuid is null or source_id = $1)
            and ($2::uuid is null or target_id = $2)
          order by created_at desc
        `;
        const v = [source_id || null, target_id || null];
        const result = await client.query(q, v);
        client.release();
        return res.status(200).json({ status: 'success', links: result.rows });
      }

      default:
        client.release();
        return res.status(400).json({ error: 'Unknown type in relay' });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
