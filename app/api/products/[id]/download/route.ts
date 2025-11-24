import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Product } from '@/lib/models/Product'
import { User } from '@/lib/models/User'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    await connectDB()

    const productId = params.id

    // 查找商品
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, message: '商品不存在' },
        { status: 404 }
      )
    }

    // 检查用户是否已购买
    const user = await User.findById(payload.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    const hasPurchased = user.purchasedProducts.some(
      (id: any) => id.toString() === productId
    )

    if (!hasPurchased) {
      return NextResponse.json(
        { success: false, message: '您还未购买此商品' },
        { status: 403 }
      )
    }

    // 返回下载链接
    return NextResponse.json({
      success: true,
      downloadUrl: product.downloadUrl,
      productName: product.name,
    })
  } catch (error) {
    console.error('Get download URL error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
