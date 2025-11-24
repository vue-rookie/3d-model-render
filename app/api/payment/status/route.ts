import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: '缺少订单ID' },
        { status: 400 }
      )
    }

    await connectDB()

    const order = await Order.findOne({ orderId, userId: payload.userId })
    if (!order) {
      return NextResponse.json(
        { success: false, message: '订单不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId,
        status: order.status,
        amount: order.amount,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      },
    })
  } catch (error) {
    console.error('Get order status error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
