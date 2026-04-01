// Vercel Serverless Function - 订单验证
// 注意：此为演示版本，实际订单验证需连接腾讯云数据库

const ADMIN_PWD = 'bochoco2026';
const REDIRECT_URL = 'https://shop184291289.youzan.com/wscump/coupon/fetch?alias=nkpn3gi9&sign=e874e5cd2f3beb1b3db7d65144e4acfb&shopAutoEnter=1';

// 内存存储（演示用）
const orders = new Map();

// 初始化一些演示订单
['P123456789012345678', 'P987654321098765432', 'P111122223333444445'].forEach(oid => {
  orders.set(oid, { orderId: oid, status: 'pending' });
});

module.exports = (req, res) => {
  // CORS
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
    const { orderId } = req.body || {};

    if (!orderId) {
      return res.status(200).json({ success: false, error: '请输入订单号' });
    }

    const oid = String(orderId).trim().toUpperCase();

    if (!/^P\d{18}$/.test(oid)) {
      return res.status(200).json({ success: false, error: '订单号格式错误，应为P+18位数字' });
    }

    // 检查订单是否存在
    if (!orders.has(oid)) {
      return res.status(200).json({ success: false, error: '订单号不存在，请检查后重试' });
    }

    const order = orders.get(oid);

    if (order.status === 'used') {
      return res.status(200).json({ success: false, error: '该订单号已被使用' });
    }

    // 标记为已使用
    order.status = 'used';
    orders.set(oid, order);

    return res.status(200).json({ success: true, redirectUrl: REDIRECT_URL });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};