import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { User } from '@/lib/models/User'

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

export async function POST(request: NextRequest) {
  try {
    const XUNHUPAY_APPSECRET = process.env.XUNHUPAY_APPSECRET || ''

    // 解析表单数据
    const formData = await request.formData()
    const data: Record<string, any> = {}

    formData.forEach((value, key) => {
      data[key] = value
    })

    console.log('[Payment] ===== Notification Start =====')
    console.log('[Payment] Received data:', JSON.stringify(data, null, 2))

    // 验证签名
    const calculatedHash = getHash(data, XUNHUPAY_APPSECRET)
    console.log('[Payment] Calculated hash:', calculatedHash)
    console.log('[Payment] Received hash:', data.hash)

    if (data.hash !== calculatedHash) {
      console.log('[Payment] ❌ Signature verification failed')
      return new NextResponse('success', { status: 200 })
    }

    console.log('[Payment] ✅ Signature verified')

    // 检查支付状态
    console.log('[Payment] Order status:', data.status)

    if (data.status === 'OD') {
      console.log('[Payment] ✅ Payment successful for order:', data.trade_order_id)

      await connectDB()
      console.log('[Payment] Database connected')

      // 查找订单
      const order = await Order.findOne({ orderId: data.trade_order_id })
      console.log('[Payment] Order found:', order ? 'Yes' : 'No')

      if (!order) {
        console.log('[Payment] ❌ Order not found:', data.trade_order_id)
        return new NextResponse('success', { status: 200 })
      }

      console.log('[Payment] Order current status:', order.status)

      if (order.status !== 'paid') {
        // 更新订单状态
        order.status = 'paid'
        order.paidAt = new Date()
        await order.save()
        console.log('[Payment] ✅ Order status updated to paid')

        // 将商品添加到用户已购买列表
        const updateResult = await User.findByIdAndUpdate(
          order.userId,
          { $addToSet: { purchasedProducts: order.productId } },
          { new: true }
        )
        console.log('[Payment] ✅ User purchase list updated:', updateResult ? 'Success' : 'Failed')

        console.log('[Payment] ===== Order processed successfully =====')
      } else {
        console.log('[Payment] ⚠️  Order already paid, skipping')
      }
    } else {
      console.log('[Payment] ⚠️  Payment not completed, status:', data.status)
    }

    console.log('[Payment] ===== Notification End =====')
    return new NextResponse('success', { status: 200 })
  } catch (error) {
    console.error('[Payment] ❌ Notification error:', error)
    return new NextResponse('success', { status: 200 })
  }
}
