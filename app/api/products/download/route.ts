import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Product } from '@/lib/models/Product'
import { User } from '@/lib/models/User'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { success: false, message: '缺少商品ID' },
        { status: 400 }
      )
    }

    // 查找用户
    const user = await User.findById(payload.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查用户是否购买了该商品
    const hasPurchased = user.purchasedProducts.some(
      (id: any) => id.toString() === productId
    )

    if (!hasPurchased) {
      return NextResponse.json(
        { success: false, message: '您还未购买该商品' },
        { status: 403 }
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

    // 返回下载URL
    return NextResponse.json({
      success: true,
      downloadUrl: product.downloadUrl,
      productName: product.name,
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
