"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Cable as Cube, ArrowLeft, ShoppingCart, Eye, User, LogOut, Check, Loader2, Download, X } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  modelUrl: string
  category: string
  isPurchased: boolean
  downloadUrl?: string
}

const categories = ["全部", "科学", "建筑", "角色", "家具", "交通", "自然"]

export default function ProductsPage() {
  const { user, token, isLoading: authLoading, isLoggedIn, logout, refreshUser } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [isLoading, setIsLoading] = useState(true)
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrcodeUrl, setQrcodeUrl] = useState("")
  const [currentOrderId, setCurrentOrderId] = useState("")
  const [currentProductId, setCurrentProductId] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "checking" | "success" | "failed">("pending")

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const url = selectedCategory === "全部"
        ? "/api/products"
        : `/api/products?category=${encodeURIComponent(selectedCategory)}`

      const response = await fetch(url, { headers })
      const data = await response.json()

      if (data.success) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      fetchProducts()
    }
  }, [selectedCategory, token, authLoading])

  const handlePurchase = async (productId: string) => {
    if (!isLoggedIn) {
      window.location.href = "/login"
      return
    }

    setPurchasingId(productId)
    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      })

      const data = await response.json()
      if (data.success && data.url_qrcode) {
        // 显示二维码弹窗
        setQrcodeUrl(data.url_qrcode)
        setCurrentOrderId(data.orderId)
        setCurrentProductId(productId)
        setPaymentStatus("pending")
        setShowQRCode(true)
        // 开始轮询支付状态
        startPolling(data.orderId, productId)
      } else {
        alert(data.message || "创建订单失败")
      }
    } catch {
      alert("网络错误，请重试")
    } finally {
      setPurchasingId(null)
    }
  }

  const startPolling = (orderId: string, productId: string) => {
    setPaymentStatus("checking")
    let pollCount = 0
    const maxPolls = 150 // 最多轮询150次（5分钟）

    console.log('[Client] 开始轮询支付状态, orderId:', orderId)

    const pollInterval = setInterval(async () => {
      pollCount++
      console.log(`[Client] 轮询第 ${pollCount} 次...`)

      if (pollCount > maxPolls) {
        console.log('[Client] 轮询超时，停止检查')
        clearInterval(pollInterval)
        setPaymentStatus("failed")
        return
      }

      try {
        // 使用主动查询接口，而不是仅查询本地状态
        const response = await fetch(`/api/payment/query?orderId=${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()
        console.log('chaxun',data)
        console.log('[Client] 支付状态:', data.isPaid ? 'paid' : 'pending')

        if (data.success && data.isPaid) {
          console.log('[Client] ✅ 支付成功！')
          clearInterval(pollInterval)
          setPaymentStatus("success")

          // 支付成功后的处理
          setTimeout(async () => {
            await handlePaymentSuccess(productId)
          }, 500)
        }
      } catch (error) {
        console.error("[Client] 轮询支付状态失败:", error)
      }
    }, 3000) // 每3秒查询一次（主动查询比本地查询慢一点）
  }

  const handlePaymentSuccess = async (productId: string) => {
    try {
      // 1. 刷新用户信息（更新购买记录）
      await refreshUser()

      // 2. 刷新产品列表
      await fetchProducts()

      // 3. 获取下载链接
      const response = await fetch(`/api/products/download?productId=${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      // 4. 自动下载
      if (data.success && data.downloadUrl) {
        setTimeout(() => {
          window.open(data.downloadUrl, "_blank")
        }, 1000)
      }
    } catch (error) {
      console.error("支付成功后处理失败:", error)
    }
  }

  const handleDownload = async (productId: string, downloadUrl?: string) => {
    if (!downloadUrl) {
      alert("下载链接不可用")
      return
    }

    try {
      // 直接打开下载链接
      window.open(downloadUrl, "_blank")
    } catch {
      alert("下载失败，请重试")
    }
  }

  const closeQRCodeModal = () => {
    setShowQRCode(false)
    setQrcodeUrl("")
    setCurrentOrderId("")
    setCurrentProductId("")
    setPaymentStatus("pending")
  }

  const manualCheckPayment = async () => {
    if (!currentOrderId) return

    try {
      console.log('[Client] 手动检查支付状态...')
      const response = await fetch(`/api/payment/query?orderId=${currentOrderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      console.log('[Client] 手动检查结果:', data)

      if (data.success && data.isPaid) {
        setPaymentStatus("success")
        await handlePaymentSuccess(currentProductId)
      } else {
        alert("支付尚未完成，请完成支付后再试")
      }
    } catch (error) {
      console.error("手动检查支付状态失败:", error)
      alert("检查失败，请重试")
    }
  }

  return (
    <div className="min-h-screen bg-black dark">
      {/* 头部导航 */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Cube className="h-8 w-8 text-cyan-400" />
            <span className="text-xl font-bold text-white">3D Studio</span>
          </Link>
          <div className="flex items-center gap-4">
            {authLoading ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            ) : isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {user?.username}
                </span>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="text-gray-300 hover:text-white"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  退出
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                    注册
                  </Button>
                </Link>
              </div>
            )}
            <Link href="/">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回首页
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 页面标题 */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            3D作品商城
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            精选高质量3D模型，满足您的各种创作需求
          </p>
        </div>
      </section>

      {/* 分类筛选 */}
      <section className="py-8 bg-black border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                className={
                  selectedCategory === category
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                    : "border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* 商品列表 */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gray-900 border-gray-800 overflow-hidden"
                >
                  <div className="relative h-64 bg-gray-800 overflow-hidden">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Cube className="h-24 w-24 text-gray-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      {product.isPurchased && (
                        <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          已购买
                        </span>
                      )}
                      <span className="px-3 py-1 bg-cyan-500 text-white text-sm rounded-full">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-400 mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold text-cyan-400">
                        ¥{product.price}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/products/${product.id}`} className="flex-1">
                        <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          预览
                        </Button>
                      </Link>
                      {product.isPurchased ? (
                        <Button
                          onClick={() => handleDownload(product.id, product.downloadUrl)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          下载
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePurchase(product.id)}
                          disabled={purchasingId === product.id}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white cursor-pointer"
                        >
                          {purchasingId === product.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              处理中...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              购买
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-xl">该分类暂无商品</p>
            </div>
          )}
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-12 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2025 3D Studio. 保留所有权利。</p>
        </div>
      </footer>

      {/* 二维码支付弹窗 */}
      {showQRCode && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
            onClick={paymentStatus === "success" ? closeQRCodeModal : undefined}
          >
            {/* 弹窗内容 */}
            <div
              className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              {paymentStatus !== "checking" && (
                <button
                  onClick={closeQRCodeModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              )}

              <div className="text-center">
                {paymentStatus === "pending" || paymentStatus === "checking" ? (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      微信扫码支付
                    </h3>
                    <p className="text-gray-400 mb-6">
                      请使用微信扫描下方二维码完成支付
                    </p>

                    {/* 二维码图片 */}
                    <div className="bg-white p-4 rounded-lg inline-block mb-6">
                      <Image
                        src={qrcodeUrl}
                        alt="支付二维码"
                        width={200}
                        height={200}
                        className="mx-auto"
                      />
                    </div>

                    {paymentStatus === "checking" && (
                      <>
                        <div className="flex items-center justify-center gap-2 text-cyan-400 mb-4">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>等待支付中...</span>
                        </div>
                        <Button
                          onClick={manualCheckPayment}
                          variant="outline"
                          className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                        >
                          已完成支付？点击确认
                        </Button>
                      </>
                    )}
                  </>
                ) : paymentStatus === "success" ? (
                  <>
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        支付成功！
                      </h3>
                      <p className="text-gray-400 mb-4">
                        文件下载即将开始...
                      </p>
                    </div>
                    <Button
                      onClick={closeQRCodeModal}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      完成
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        支付失败
                      </h3>
                      <p className="text-gray-400 mb-4">
                        请重新尝试或联系客服
                      </p>
                    </div>
                    <Button
                      onClick={closeQRCodeModal}
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      关闭
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
