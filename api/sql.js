import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing SQL query' });

  try {
    const client = await pool.connect();
    const result = await client.query(query);
    client.release();

    res.status(200).json({ status: 'success', rows: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
