const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const raw = await kv.get(`pred:${userId}`);
  if (!raw) return res.status(200).json(null);

  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return res.status(200).json(data);
};
