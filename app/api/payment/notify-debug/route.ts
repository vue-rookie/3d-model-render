import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// 调试端点 - 记录所有收到的回调数据
export async function POST(request: NextRequest) {
  try {
    // 解析表单数据
    const formData = await request.formData()
    const data: Record<string, any> = {}

    formData.forEach((value, key) => {
      data[key] = value
    })

    // 记录到文件
    const logData = {
      timestamp: new Date().toISOString(),
      data,
      headers: Object.fromEntries(request.headers.entries()),
    }

    console.log('========== NOTIFY DEBUG ==========')
    console.log(JSON.stringify(logData, null, 2))
    console.log('==================================')

    // 保存到文件（可选）
    try {
      const logPath = join(process.cwd(), 'payment-callback-debug.json')
      await writeFile(logPath, JSON.stringify(logData, null, 2))
      console.log('调试数据已保存到:', logPath)
    } catch (e) {
      console.log('保存文件失败，但不影响回调处理')
    }

    return new NextResponse('success', { status: 200 })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return new NextResponse('success', { status: 200 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'This is payment notification debug endpoint',
    timestamp: new Date().toISOString(),
  })
}
