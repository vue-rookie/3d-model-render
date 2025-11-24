const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-studio'

// 定义 Product Schema
const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  modelUrl: String,
  downloadUrl: String,
  category: String,
  createdAt: Date,
})

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

async function importProducts() {
  try {
    console.log('连接到 MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('已连接到 MongoDB')

    // 读取 JSON 文件
    const jsonPath = path.join(__dirname, '../data/products.json')
    const jsonData = fs.readFileSync(jsonPath, 'utf-8')
    const products = JSON.parse(jsonData)

    console.log(`准备导入 ${products.length} 条商品数据...`)

    // 清空现有数据（可选，如果不需要清空就注释掉）
    // await Product.deleteMany({})
    // console.log('已清空现有商品数据')

    // 批量插入
    const result = await Product.insertMany(products)
    console.log(`成功导入 ${result.length} 条商品数据！`)

    // 显示导入的商品
    result.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ¥${product.price}`)
    })

    await mongoose.disconnect()
    console.log('已断开 MongoDB 连接')
  } catch (error) {
    console.error('导入失败:', error)
    process.exit(1)
  }
}

importProducts()
