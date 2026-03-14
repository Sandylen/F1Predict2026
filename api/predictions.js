const { kv } = require('@vercel/kv');

async function getAuthUser(req) {
  const userId = req.headers['x-user-id'];
  if (!userId || typeof userId !== 'string') return null;
  const raw = await kv.get(`user:${userId}`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

module.exports = async function handler(req, res) {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method === 'POST') {
    const predictions = req.body;
    if (!predictions || !predictions.drivers || !predictions.constructors) {
      return res.status(400).json({ error: 'Invalid predictions data' });
    }

    const data = {
      drivers: predictions.drivers,
      constructors: predictions.constructors,
      initialDrivers: predictions.initialDrivers || null,
      initialConstructors: predictions.initialConstructors || null,
      isLocked: !!predictions.isLocked,
      points: typeof predictions.points === 'number' ? predictions.points : 1000,
      changesCount: typeof predictions.changesCount === 'number' ? predictions.changesCount : 0,
      pointsSpent: typeof predictions.pointsSpent === 'number' ? predictions.pointsSpent : 0,
      history: Array.isArray(predictions.history) ? predictions.history : [],
      updatedAt: new Date().toISOString()
    };

    await kv.set(`pred:${user.userId}`, JSON.stringify(data));
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const raw = await kv.get(`pred:${user.userId}`);
    if (!raw) return res.status(200).json(null);
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
