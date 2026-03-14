const { kv } = require('@vercel/kv');

async function getAuthUser(req) {
  const userId = req.headers['x-user-id'];
  if (!userId || typeof userId !== 'string') return null;
  const raw = await kv.get(`user:${userId}`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

module.exports = async function handler(req, res) {
  const { code } = req.query;
  if (!code || typeof code !== 'string' || code.length !== 6) {
    return res.status(400).json({ error: 'Invalid group code' });
  }

  const upperCode = code.toUpperCase();

  if (req.method === 'GET') {
    const raw = await kv.get(`group:${upperCode}`);
    if (!raw) return res.status(404).json({ error: 'Group not found' });
    const group = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.status(200).json(group);
  }

  if (req.method === 'PUT') {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const raw = await kv.get(`group:${upperCode}`);
    if (!raw) return res.status(404).json({ error: 'Group not found' });

    const group = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const alreadyMember = group.members.some(m => m.userId === user.userId);
    if (alreadyMember) {
      return res.status(200).json(group);
    }

    group.members.push({
      userId: user.userId,
      name: user.name,
      joinedAt: new Date().toISOString()
    });

    await kv.set(`group:${upperCode}`, JSON.stringify(group));

    const userGroupsRaw = await kv.get(`usergroups:${user.userId}`);
    const userGroups = userGroupsRaw ? (typeof userGroupsRaw === 'string' ? JSON.parse(userGroupsRaw) : userGroupsRaw) : [];
    if (!userGroups.includes(upperCode)) {
      userGroups.push(upperCode);
      await kv.set(`usergroups:${user.userId}`, JSON.stringify(userGroups));
    }

    return res.status(200).json(group);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
