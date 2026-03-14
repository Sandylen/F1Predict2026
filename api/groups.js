const { kv } = require('@vercel/kv');

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

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
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 50) {
      return res.status(400).json({ error: 'Group name is required (max 50 characters)' });
    }

    const sanitizedName = name.trim().replace(/[<>"'&]/g, '');

    let code;
    let attempts = 0;
    do {
      code = generateCode();
      const existing = await kv.get(`group:${code}`);
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return res.status(500).json({ error: 'Failed to generate unique code' });
    }

    const group = {
      code,
      name: sanitizedName,
      createdBy: user.userId,
      members: [{ userId: user.userId, name: user.name, joinedAt: new Date().toISOString() }],
      createdAt: new Date().toISOString()
    };

    await kv.set(`group:${code}`, JSON.stringify(group));

    const userGroupsRaw = await kv.get(`usergroups:${user.userId}`);
    const userGroups = userGroupsRaw ? (typeof userGroupsRaw === 'string' ? JSON.parse(userGroupsRaw) : userGroupsRaw) : [];
    userGroups.push(code);
    await kv.set(`usergroups:${user.userId}`, JSON.stringify(userGroups));

    return res.status(201).json(group);
  }

  if (req.method === 'GET') {
    const userGroupsRaw = await kv.get(`usergroups:${user.userId}`);
    const groupCodes = userGroupsRaw ? (typeof userGroupsRaw === 'string' ? JSON.parse(userGroupsRaw) : userGroupsRaw) : [];

    const groups = [];
    for (const code of groupCodes) {
      const raw = await kv.get(`group:${code}`);
      if (raw) {
        const group = typeof raw === 'string' ? JSON.parse(raw) : raw;
        groups.push(group);
      }
    }

    return res.status(200).json(groups);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
