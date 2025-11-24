import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { Product } from '@/lib/models/Product'
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

    await connectDB()

    const user = await User.findById(payload.userId).populate('purchasedProducts')
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    // 获取已购买商品的详细信息
    const purchases = await Product.find({
      _id: { $in: user.purchasedProducts },
    })

    return NextResponse.json({
      success: true,
      purchases: purchases.map((product) => ({
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        modelUrl: product.modelUrl,
        downloadUrl: product.downloadUrl,
        category: product.category,
      })),
    })
  } catch (error) {
    console.error('Get purchases error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
