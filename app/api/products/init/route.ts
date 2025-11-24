import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Product } from '@/lib/models/Product'

// 初始化商品数据
const initialProducts = [
  {
    name: "火星地形模型",
    description: "高精度火星表面地形3D模型，适合科学展示和教育用途",
    price: 2.99,
    image: "/mars.glb",
    modelUrl: "/mars.glb",
    category: "科学"
  },
  {
    name: "现代建筑模型",
    description: "精美的现代建筑3D模型，适合建筑可视化项目",
    price: 4.99,
    image: "/models/building.glb",
    modelUrl: "/models/building.glb",
    category: "建筑"
  },
  {
    name: "角色模型",
    description: "游戏级别的角色3D模型，包含完整骨骼和动画",
    price: 7.99,
    image: "/models/character.glb",
    modelUrl: "/models/character.glb",
    category: "角色"
  },
  {
    name: "家具套装",
    description: "现代家具3D模型套装，适合室内设计和可视化",
    price: 3.99,
    image: "/models/furniture.glb",
    modelUrl: "/models/furniture.glb",
    category: "家具"
  },
  {
    name: "汽车模型",
    description: "高精度汽车3D模型，包含内饰和外观细节",
    price: 8.99,
    image: "/models/car.glb",
    modelUrl: "/models/car.glb",
    category: "交通"
  },
  {
    name: "植物模型包",
    description: "多种植物3D模型，适合景观设计和游戏场景",
    price: 1.99,
    image: "/models/plants.glb",
    modelUrl: "/models/plants.glb",
    category: "自然"
  }
]

export async function POST() {
  try {
    await connectDB()

    // 检查是否已有商品
    const existingCount = await Product.countDocuments()
    if (existingCount > 0) {
      return NextResponse.json({
        success: false,
        message: '商品数据已存在，无需初始化',
      })
    }

    // 批量插入初始商品
    await Product.insertMany(initialProducts)

    return NextResponse.json({
      success: true,
      message: '商品数据初始化成功',
      count: initialProducts.length,
    })
  } catch (error) {
    console.error('Init products error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
