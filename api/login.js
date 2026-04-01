// Vercel Serverless Function - 管理员登录
const crypto = require('crypto');
const ADMIN_PWD = 'bochoco2026';

// 内存存储 token
const TOKENS = new Set();

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  try {
    const { password } = req.body || {};

    if (password !== ADMIN_PWD) {
      return res.status(401).json({ success: false, error: '密码错误' });
    }

    const token = crypto.randomUUID();
    TOKENS.add(token);

    return res.status(200).json({
      success: true,
      token,
      stats: { total: 0, used: 0, remaining: 0 }
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};