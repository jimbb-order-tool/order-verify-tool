const cloudbase = require('@cloudbase/node-sdk')
const crypto = require('crypto')

// 初始化云开发
const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
})

const db = app.database()
const ADMIN_PASSWORD = 'bochoco2026'
const JWT_SECRET = 'jinbobo-secret-key-2026'
const SYSTEM_STATE_COLLECTION = 'system_state'
const ORDERS_COLLECTION = 'xiaohongshu_orders'

// 获取系统状态
async function getSystemState() {
  try {
    const result = await db.collection(SYSTEM_STATE_COLLECTION).doc('state').get()
    if (result.data && result.data.length > 0) {
      return result.data[0]
    }
    // 如果不存在，创建初始状态
    await db.collection(SYSTEM_STATE_COLLECTION).add({
      _id: 'state',
      lastResetTime: 0,
      totalOrders: 0
    })
    return { lastResetTime: 0, totalOrders: 0 }
  } catch (e) {
    return { lastResetTime: 0, totalOrders: 0 }
  }
}

// 更新系统状态
async function updateSystemState(data) {
  try {
    await db.collection(SYSTEM_STATE_COLLECTION).doc('state').set(data)
    return true
  } catch (e) {
    // 如果文档不存在，先创建
    try {
      await db.collection(SYSTEM_STATE_COLLECTION).add({
        _id: 'state',
        ...data
      })
    } catch (e2) {
      // 忽略
    }
    return false
  }
}

// JWT简易实现
function sign(payload) {
  const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(header+'.'+body).digest('base64url')
  return header+'.'+body+'.'+sig
}

function verify(token) {
  try {
    const [h,b,s] = token.split('.')
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(h+'.'+b).digest('base64url')
    if(sig!==s)return null
    return JSON.parse(Buffer.from(b,'base64url').toString())
  }catch(e){return null}
}

// 主入口 - 处理HTTP请求
exports.main = async (event, context) => {
  const { httpMethod, path, body: rawBody, headers } = event
  const method = httpMethod || 'GET'
  
  // 解析请求体
  let body = {}
  try {
    if (typeof rawBody === 'string') {
      body = JSON.parse(rawBody)
    } else if (rawBody) {
      body = rawBody
    }
  } catch(e) {}
  
  // 路由分发
  const route = path.replace('/api', '').replace(/^\//, '') || 'verify'
  
  console.log('Request:', { method, path, route, body })
  
  // CORS响应头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
  
  // 处理OPTIONS预检请求
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    }
  }
  
  let result
  
  try {
    switch(route) {
      case 'verify':
        result = await handleVerify(body)
        break
      case 'login':
        result = await handleLogin(body)
        break
      case 'import':
        result = await handleImport(body, headers)
        break
      case 'stats':
        result = await handleStats(headers)
        break
      case 'clear':
        result = await handleClear(headers)
        break
      default:
        result = { success: false, error: '未知接口: ' + route }
    }
  } catch (error) {
    console.error('Error:', error)
    result = { success: false, error: '系统错误: ' + error.message }
  }
  
  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result)
  }
}

// 验证订单
async function handleVerify(body) {
  const { orderId } = body
  
  if (!orderId) {
    return { success: false, error: '请输入订单号' }
  }
  
  // 小红书订单号格式验证：P + 18位数字
  const orderPattern = /^P\d{18}$/i
  
  if (!orderPattern.test(orderId)) {
    return {
      success: false,
      error: '订单号格式错误，请输入正确的格式（如：P123456789012345678）'
    }
  }
  
  try {
    // 获取系统状态（最后重置时间）
    const systemState = await getSystemState()
    const lastResetTime = systemState.lastResetTime || 0
    
    // 查询订单号是否存在
    const result = await db.collection(ORDERS_COLLECTION)
      .where({ 
        order_id: orderId.toUpperCase(),
        created_at: db.command.gt(lastResetTime)
      })
      .get()
    
    if (result.data.length === 0) {
      return {
        success: false,
        error: '订单号不存在或已使用，请核对后重新输入'
      }
    }
    
    // 查找未使用的订单
    const unusedOrder = result.data.find(o => o.used !== true)
    
    if (!unusedOrder) {
      return {
        success: false,
        error: '订单号不存在或已使用，请核对后重新输入'
      }
    }
    
    // 获取订单记录ID
    const docId = unusedOrder._id
    
    // 标记为已使用
    await db.collection(ORDERS_COLLECTION)
      .doc(docId)
      .update({ used: true, used_at: Date.now() })
    
    // 成功后跳转到固定链接
    const redirectUrl = 'https://shop184291289.youzan.com/wscump/coupon/fetch?alias=nkpn3gi9&sign=e874e5cd2f3beb1b3db7d65144e4acfb&shopAutoEnter=1'
    
    return {
      success: true,
      redirectUrl
    }
    
  } catch (error) {
    console.error('验证失败:', error)
    return {
      success: false,
      error: '系统异常，请稍后重试'
    }
  }
}

// 管理员登录
async function handleLogin(body) {
  const { password } = body
  
  if (password !== ADMIN_PASSWORD) {
    return { success: false, error: '密码错误' }
  }
  
  const token = sign({ role: 'admin', exp: Date.now() + 86400000 })
  return { success: true, token }
}

// 导入订单
async function handleImport(body, headers) {
  const auth = verifyToken(headers)
  if (!auth) return { success: false, error: '未登录' }
  
  // 处理两种格式：{orders: [...]} 或直接是 [...]
  let orders = body
  if (body && body.orders) {
    orders = body.orders
  }
  
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return { success: false, error: '订单列表为空' }
  }
  
  const orderPattern = /^P\d{18}$/i
  const validOrders = orders.filter(o => orderPattern.test(o))
  
  if (validOrders.length === 0) {
    return { success: false, error: '没有有效的订单号' }
  }
  
  try {
    // 分批插入，每批1000条
    const BATCH_SIZE = 1000
    let imported = 0
    let invalid = orders.length - validOrders.length
    let now = Date.now()
    
    // 去重
    const uniqueOrders = [...new Set(validOrders.map(o => o.toUpperCase()))]
    
    for (let i = 0; i < uniqueOrders.length; i += BATCH_SIZE) {
      const batchOrders = uniqueOrders.slice(i, i + BATCH_SIZE)
      
      const batch = batchOrders.map(orderId => ({
        order_id: orderId,
        created_at: now,
        used: false
      }))
      
      try {
        await db.collection(ORDERS_COLLECTION).add(batch)
        imported += batch.length
      } catch (batchError) {
        console.error('批次导入失败:', batchError)
        // 如果批次失败，尝试逐条插入
        for (const order of batchOrders) {
          try {
            await db.collection(ORDERS_COLLECTION).add({
              order_id: order,
              created_at: now,
              used: false
            })
            imported++
          } catch (singleError) {
            // 忽略单个插入失败（可能是重复）
          }
        }
      }
    }
    
    return {
      success: true,
      imported: imported,
      invalid: invalid
    }
  } catch (error) {
    console.error('导入失败:', error)
    return { success: false, error: '导入失败: ' + error.message }
  }
}

// 统计数据
async function handleStats(headers) {
  const auth = verifyToken(headers)
  if (!auth) return { success: false, error: '未登录' }
  
  try {
    const systemState = await getSystemState()
    const lastResetTime = systemState.lastResetTime || 0
    
    // 统计在重置时间之后创建的有效订单总数
    const totalResult = await db.collection(ORDERS_COLLECTION)
      .where({
        created_at: db.command.gt(lastResetTime)
      })
      .count()
    
    // 统计在重置时间之后已使用的订单数
    const usedResult = await db.collection(ORDERS_COLLECTION)
      .where({
        created_at: db.command.gt(lastResetTime),
        used: true
      })
      .count()
    
    const total = totalResult.total || 0
    const used = usedResult.total || 0
    
    return {
      success: true,
      total: total,
      used: used,
      remaining: total - used,
      lastResetTime: lastResetTime
    }
  } catch (error) {
    console.error('统计失败:', error)
    return { success: false, error: '统计失败' }
  }
}

// 清空数据（重置）
async function handleClear(headers) {
  const auth = verifyToken(headers)
  if (!auth) return { success: false, error: '未登录' }
  
  try {
    // 获取当前时间作为新的重置时间点
    const now = Date.now()
    await updateSystemState({ lastResetTime: now })
    
    return { 
      success: true, 
      message: '已重置，所有订单变为未使用状态',
      resetTime: now
    }
  } catch (error) {
    console.error('重置失败:', error)
    return { success: false, error: '重置失败: ' + error.message }
  }
}

// 验证Token
function verifyToken(headers) {
  const auth = headers?.Authorization || headers?.authorization
  if (!auth) return null
  
  const token = auth.replace('Bearer ', '')
  return verify(token)
}
