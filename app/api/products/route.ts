import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Product } from '@/lib/models/Product'
import { User } from '@/lib/models/User'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const query = category && category !== '全部' ? { category } : {}
    const products = await Product.find(query).sort({ createdAt: -1 })

    // 获取当前用户的已购买商品列表
    let purchasedProductIds: string[] = []
    const payload = getUserFromRequest(request)

    if (payload) {
      const user = await User.findById(payload.userId)
      if (user) {
        purchasedProductIds = user.purchasedProducts.map((id: any) => id.toString())
      }
    }

    // 给每个商品添加是否已购买的字段
    const productsWithPurchaseStatus = products.map((product) => {
      const isPurchased = purchasedProductIds.includes(product._id.toString())
      return {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        modelUrl: product.modelUrl,
        category: product.category,
        isPurchased,
        // 只有已购买的商品才返回downloadUrl
        downloadUrl: isPurchased ? product.downloadUrl : undefined,
      }
    })

    return NextResponse.json({
      success: true,
      products: productsWithPurchaseStatus,
    })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}

// 创建商品（管理用）
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { name, description, price, image, modelUrl, category } = body

    if (!name || !description || price === undefined || !image || !modelUrl || !category) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    const product = new Product({
      name,
      description,
      price,
      image,
      modelUrl,
      category,
    })

    await product.save()

    return NextResponse.json({
      success: true,
      message: '商品创建成功',
      product,
    })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
