
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const now = new Date().toISOString();
  return res.status(200).json({
    status: 'success',
    message: `Heartbeat triggered at ${now}`
  });
}
