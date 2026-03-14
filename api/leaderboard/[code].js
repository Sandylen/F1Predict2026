const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;
  if (!code || typeof code !== 'string' || code.length !== 6) {
    return res.status(400).json({ error: 'Invalid group code' });
  }

  const upperCode = code.toUpperCase();
  const raw = await kv.get(`group:${upperCode}`);
  if (!raw) return res.status(404).json({ error: 'Group not found' });

  const group = typeof raw === 'string' ? JSON.parse(raw) : raw;

  // Fetch all members' predictions in parallel
  const predKeys = group.members.map(m => `pred:${m.userId}`);
  let allPreds;
  if (predKeys.length > 0) {
    const results = await kv.mget(...predKeys);
    allPreds = results.map(r => {
      if (!r) return null;
      return typeof r === 'string' ? JSON.parse(r) : r;
    });
  } else {
    allPreds = [];
  }

  const members = group.members.map((m, i) => {
    const pred = allPreds[i];
    return {
      userId: m.userId,
      name: m.name,
      joinedAt: m.joinedAt,
      points: pred ? pred.points : 1000,
      changesCount: pred ? pred.changesCount : 0,
      pointsSpent: pred ? pred.pointsSpent : 0,
      isLocked: pred ? pred.isLocked : false,
      hasPredictions: !!pred
    };
  });

  // Sort by points remaining (descending)
  members.sort((a, b) => b.points - a.points);

  return res.status(200).json({
    code: group.code,
    name: group.name,
    createdBy: group.createdBy,
    createdAt: group.createdAt,
    members
  });
};
