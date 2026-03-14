const { kv } = require('@vercel/kv');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 30) {
      return res.status(400).json({ error: 'Name is required (max 30 characters)' });
    }

    const userId = crypto.randomUUID();
    const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
    const sanitizedName = name.trim().replace(/[<>"'&]/g, '');

    const user = {
      userId,
      name: sanitizedName,
      ip,
      createdAt: new Date().toISOString()
    };

    await kv.set(`user:${userId}`, JSON.stringify(user));
    return res.status(201).json(user);
  }

  if (req.method === 'GET') {
    const userId = req.headers['x-user-id'];
    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const raw = await kv.get(`user:${userId}`);
    if (!raw) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.status(200).json(user);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
