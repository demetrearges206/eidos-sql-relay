import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing SQL query' });

  try {
    const { data, error } = await supabase.rpc('execute_raw_sql', { raw_sql: query });
    if (error) throw error;
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
