import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Product } from '@/lib/models/Product'
import { User } from '@/lib/models/User'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params
    const product = await Product.findById(id)

    if (!product) {
      return NextResponse.json(
        { success: false, message: '商品不存在' },
        { status: 404 }
      )
    }

    // 检查用户是否已购买
    let isPurchased = false
    const payload = getUserFromRequest(request)

    if (payload) {
      const user = await User.findById(payload.userId)
      if (user) {
        isPurchased = user.purchasedProducts.some(
          (pid: any) => pid.toString() === product._id.toString()
        )
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        modelUrl: product.modelUrl,
        category: product.category,
        isPurchased,
        downloadUrl: isPurchased ? product.downloadUrl : undefined,
      },
    })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
