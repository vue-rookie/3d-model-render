import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Product } from '@/lib/models/Product'
import { getUserFromRequest } from '@/lib/auth'

// 生成hash签名的函数
function getHash(params: Record<string, any>, appSecret: string): string {
  const sortedParams = Object.keys(params)
    .filter(key => params[key] && key !== 'hash')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')

  const stringSignTemp = sortedParams + appSecret
  return crypto.createHash('md5').update(stringSignTemp).digest('hex')
}

// 生成随机字符串
function generateNonceStr(): string {
  return Date.now().toString(16).slice(0, 6) + '-' + Math.random().toString(16).slice(2, 8)
}

// 获取当前时间戳
function getNowDate(): number {
  return Math.floor(new Date().valueOf() / 1000)
}

// 生成唯一订单号
function generateOrderId(): string {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, message: '缺少商品ID' },
        { status: 400 }
      )
    }

    // 查找商品
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, message: '商品不存在' },
        { status: 404 }
      )
    }

    // 虎皮椒配置参数
    const XUNHUPAY_APPID = process.env.XUNHUPAY_APPID || '201906175208'
    const XUNHUPAY_APPSECRET = process.env.XUNHUPAY_APPSECRET || '49e2d451da2383abe2cdf7323d6c2832'
    const BACKEND_URL = process.env.BACK_URL ||'https://timebackward.com'
    const WAP_NAME = process.env.WAP_NAME || '3D Studio'

    if (!XUNHUPAY_APPID || !XUNHUPAY_APPSECRET || !BACKEND_URL || !WAP_NAME) {
      return NextResponse.json(
        { success: false, message: '服务器配置错误' },
        { status: 500 }
      )
    }

    // 构建支付参数
    const orderId = generateOrderId()
    const params = {
      version: '1.1',
      appid: XUNHUPAY_APPID,
      trade_order_id: orderId,
      total_fee: product.price.toFixed(2),
      title: product.name,
      time: getNowDate(),
      notify_url: `${BACKEND_URL}/api/payment/notify`,
      nonce_str: generateNonceStr(),
      type: 'WAP',
      wap_url: BACKEND_URL,
      wap_name: WAP_NAME,
    }

    // 生成签名
    const hash = getHash(params, XUNHUPAY_APPSECRET)

    // 构建请求参数
    const requestParams = new URLSearchParams({
      ...params,
      hash,
    } as any)

    // 创建本地订单记录
    const order = new Order({
      userId: payload.userId,
      productId: product._id,
      orderId,
      amount: product.price,
      status: 'pending',
    })
    await order.save()

    console.log('[Payment] Creating order:', orderId)

    // 发送支付请求
    const response = await fetch('https://api.xunhupay.com/payment/do.html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestParams.toString(),
    })

    const result = await response.json()
    console.log('[Payment] API response:', result)

    if (result.errcode === 0 && result.url) {
      // 保存虎皮椒返回的 open_order_id
      if (result.open_order_id) {
        await Order.findOneAndUpdate(
          { orderId },
          { openOrderId: result.open_order_id }
        )
        console.log('[Payment] Saved open_order_id:', result.open_order_id)
      }

      return NextResponse.json({
        success: true,
        orderId: orderId,
        paymentUrl: result.url,
        url_qrcode: result.url_qrcode,
        message: '订单创建成功',
      })
    } else {
      // 更新订单状态为失败
      await Order.findOneAndUpdate({ orderId }, { status: 'failed' })

      return NextResponse.json(
        {
          success: false,
          message: result.errmsg || '创建订单失败',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Payment] Creation error:', error)
    return NextResponse.json(
      {
        success: false,
        message: '服务器错误',
      },
      { status: 500 }
    )
  }
}
