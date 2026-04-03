// 腾讯云云函数 - 订单验证系统（使用云数据库）
const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const COLLECTION = 'orders';
const ADMIN_PWD = process.env.ADMIN_PWD || '';
const REDIRECT_URL = 'https://shop184291289.youzan.com/wscump/coupon/fetch?alias=nkpn3gi9&sign=e874e5cd2f3beb1b3db7d65144e4acfb&shopAutoEnter=1';

// 内存中存储token
const TOKENS = new Set();

// 主处理函数 - 适配SCF HTTP触发器
exports.main = async (event, context) => {
  console.log('=== EVENT START ===');
  console.log(JSON.stringify(event, null, 2));
  console.log('=== EVENT END ===');
  
  // 设置CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // 解析路径和方法（兼容不同触发方式）
    const path = event.path || event.requestContext?.http?.path || '/';
    const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
    
    // 解析body
    let data = {};
    if (event.body) {
      try {
        const bodyStr = Buffer.isBuffer(event.body) ? event.body.toString() : event.body;
        data = JSON.parse(bodyStr);
      } catch (e) {
        console.log('Body parse error:', e);
      }
    }
    
    // 解析headers
    const headers = event.headers || {};
    const auth = (headers.authorization || headers.Authorization || '').replace('Bearer ', '');
    
    console.log('Path:', path, 'Method:', method);

    // 登录（支持带或不带/api前缀）
    if ((path === '/login' || path === '/api/login') && method === 'POST') {
      if (!ADMIN_PWD) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: '后台未配置管理员密码' })
        };
      }

      if (data.password === ADMIN_PWD) {
        const token = crypto.randomUUID();
        TOKENS.add(token);
        const stats = await getStats();
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true, token, stats })
        };
      }
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: '密码错误' })
      };
    }

    // 验证订单号（支持带或不带/api前缀）
    if ((path === '/verify' || path === '/api/verify') && method === 'POST') {
      const orderId = data.orderId;
      if (!orderId) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: '请输入订单号' })
        };
      }
      
      const oid = String(orderId).trim().toUpperCase();
      if (!/^P\d{18}$/.test(oid)) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: '订单号格式错误，应为P+18位数字' })
        };
      }

      // 查询订单
      const orderRes = await db.collection(COLLECTION).where({ orderId: oid }).get();
      
      if (orderRes.data.length === 0) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: '订单号不存在，请检查后重试' })
        };
      }

      const order = orderRes.data[0];
      if (order.status === 'used') {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: '该订单号已被使用' })
        };
      }

      // 更新为已使用
      await db.collection(COLLECTION).doc(order._id).update({
        data: {
          status: 'used',
          usedAt: db.serverDate()
        }
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, redirectUrl: REDIRECT_URL })
      };
    }

    // 导入订单（支持带或不带/api前缀）
    if ((path === '/import' || path === '/api/import') && method === 'POST') {
      if (!TOKENS.has(auth)) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: '未授权' })
        };
      }

      const orders = data.orders || [];
      let added = 0, skipped = 0, duplicate = 0;

      for (const raw of orders) {
        const oid = String(raw).trim().toUpperCase();
        if (!/^P\d{18}$/.test(oid)) { 
          skipped++; 
          continue; 
        }
        
        // 检查是否已存在
        const existRes = await db.collection(COLLECTION).where({ orderId: oid }).get();
        if (existRes.data.length > 0) { 
          duplicate++; 
          continue; 
        }
        
        // 添加订单
        await db.collection(COLLECTION).add({
          data: {
            orderId: oid,
            status: 'pending',
            createdAt: db.serverDate(),
            usedAt: null
          }
        });
        added++;
      }

      const stats = await getStats();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, added, skipped, duplicate, stats })
      };
    }

    // 查看统计（支持带或不带/api前缀）
    if ((path === '/stats' || path === '/api/stats') && method === 'GET') {
      const stats = await getStats();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: stats })
      };
    }

    // 清空订单（支持带或不带/api前缀）
    if ((path === '/clear' || path === '/api/clear') && method === 'POST') {
      if (!TOKENS.has(auth)) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: '未授权' })
        };
      }

      // 获取所有订单并删除
      const allOrders = await db.collection(COLLECTION).get();
      for (const order of allOrders.data) {
        await db.collection(COLLECTION).doc(order._id).remove();
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, stats: { total: 0, used: 0, remaining: 0 } })
      };
    }

    // 未找到路由
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not Found', path, method })
    };

  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message, stack: err.stack })
    };
  }
};

async function getStats() {
  try {
    const totalRes = await db.collection(COLLECTION).count();
    const usedRes = await db.collection(COLLECTION).where({ status: 'used' }).count();
    const total = totalRes.total || 0;
    const used = usedRes.total || 0;
    return { total, used, remaining: total - used };
  } catch (e) {
    console.error('getStats error:', e);
    return { total: 0, used: 0, remaining: 0 };
  }
}