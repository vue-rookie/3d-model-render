"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, useGLTF, useFBX, Html } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Cable as Cube,
  ArrowLeft,
  ShoppingCart,
  User,
  LogOut,
  Check,
  Loader2,
  Download,
  X,
  Play,
  Pause,
  RotateCcw
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import type * as THREE from "three"

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

function AnimatedModel({
  children,
  isRotating,
}: {
  children: React.ReactNode
  isRotating: boolean
}) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!meshRef.current) return
    if (isRotating) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  return <group ref={meshRef}>{children}</group>
}

function FBXModel({
  url,
  isRotating,
}: {
  url: string
  isRotating: boolean
}) {
  const fbx = useFBX(url)
  return (
    <AnimatedModel isRotating={isRotating}>
      <primitive object={fbx} position={[0, 0, 0]} scale={[0.01, 0.01, 0.01]} />
    </AnimatedModel>
  )
}

function GLTFModel({
  url,
  isRotating,
}: {
  url: string
  isRotating: boolean
}) {
  const { scene } = useGLTF(url)
  return (
    <AnimatedModel isRotating={isRotating}>
      <primitive object={scene} position={[0, 0, 0]} scale={[1, 1, 1]} />
    </AnimatedModel>
  )
}

function Model3D({
  url,
  isRotating,
}: {
  url: string
  isRotating: boolean
}) {
  const fileExtension = url.toLowerCase().split(".").pop() || ""

  if (fileExtension === "fbx") {
    return <FBXModel url={url} isRotating={isRotating} />
  } else if (fileExtension === "glb" || fileExtension === "gltf") {
    return <GLTFModel url={url} isRotating={isRotating} />
  } else {
    return (
      <Html center>
        <div className="bg-red-500 text-white p-4 rounded-lg max-w-xs">
          <p className="font-semibold">不支持的文件格式: {fileExtension}</p>
          <p className="text-sm mt-1">目前仅支持 GLB, GLTF, FBX 格式</p>
        </div>
      </Html>
    )
  }
}

function LoadingIndicator() {
  return (
    <Html center>
      <div className="bg-blue-600/90 text-white p-6 rounded-xl backdrop-blur-sm border border-blue-400/30 min-w-[200px]">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg font-semibold">加载3D模型中...</p>
        <p className="text-sm opacity-80">请稍候</p>
      </div>
    </Html>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const { user, token, isLoading: authLoading, isLoggedIn, logout, refreshUser } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRotating, setIsRotating] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrcodeUrl, setQrcodeUrl] = useState("")
  const [currentOrderId, setCurrentOrderId] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "checking" | "success" | "failed">("pending")

  const fetchProduct = async () => {
    setIsLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`/api/products/${productId}`, { headers })
      const data = await response.json()

      if (data.success) {
        setProduct(data.product)
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && productId) {
      fetchProduct()
    }
  }, [productId, token, authLoading])

  const handlePurchase = async () => {
    if (!product) return

    if (!isLoggedIn) {
      window.location.href = "/login"
      return
    }

    setPurchasingId(product.id)
    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      })

      const data = await response.json()
      if (data.success && data.url_qrcode) {
        setQrcodeUrl(data.url_qrcode)
        setCurrentOrderId(data.orderId)
        setPaymentStatus("pending")
        setShowQRCode(true)
        startPolling(data.orderId)
      } else {
        alert(data.message || "创建订单失败")
      }
    } catch {
      alert("网络错误，请重试")
    } finally {
      setPurchasingId(null)
    }
  }

  const startPolling = (orderId: string) => {
    setPaymentStatus("checking")
    let pollCount = 0
    const maxPolls = 150

    const pollInterval = setInterval(async () => {
      pollCount++

      if (pollCount > maxPolls) {
        clearInterval(pollInterval)
        setPaymentStatus("failed")
        return
      }

      try {
        const response = await fetch(`/api/payment/query?orderId=${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()

        if (data.success && data.isPaid) {
          clearInterval(pollInterval)
          setPaymentStatus("success")

          setTimeout(async () => {
            await handlePaymentSuccess()
          }, 500)
        }
      } catch (error) {
        console.error("轮询支付状态失败:", error)
      }
    }, 3000)
  }

  const handlePaymentSuccess = async () => {
    if (!product) return

    try {
      await refreshUser()
      await fetchProduct()

      const response = await fetch(`/api/products/download?productId=${product.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (data.success && data.downloadUrl) {
        setTimeout(() => {
          window.open(data.downloadUrl, "_blank")
        }, 1000)
      }
    } catch (error) {
      console.error("支付成功后处理失败:", error)
    }
  }

  const handleDownload = async () => {
    if (!product?.downloadUrl) {
      alert("下载链接不可用")
      return
    }

    try {
      window.open(product.downloadUrl, "_blank")
    } catch {
      alert("下载失败，请重试")
    }
  }

  const closeQRCodeModal = () => {
    setShowQRCode(false)
    setQrcodeUrl("")
    setCurrentOrderId("")
    setPaymentStatus("pending")
  }

  const manualCheckPayment = async () => {
    if (!currentOrderId || !product) return

    try {
      const response = await fetch(`/api/payment/query?orderId=${currentOrderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (data.success && data.isPaid) {
        setPaymentStatus("success")
        await handlePaymentSuccess()
      } else {
        alert("支付尚未完成，请完成支付后再试")
      }
    } catch (error) {
      console.error("手动检查支付状态失败:", error)
      alert("检查失败，请重试")
    }
  }

  if (!isMounted || isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-xl mb-4">商品不存在</p>
          <Link href="/products">
            <Button className="bg-cyan-500 hover:bg-cyan-600">返回商城</Button>
          </Link>
        </div>
      </div>
    )
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
            {isLoggedIn ? (
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
            <Link href="/products">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回商城
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3D模型渲染区域 */}
          <div className="relative">
            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="h-[500px] lg:h-[600px]">
                <Canvas shadows>
                  <Suspense fallback={<LoadingIndicator />}>
                    <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={60} />

                    <ambientLight intensity={0.3} />
                    <directionalLight
                      position={[10, 10, 5]}
                      intensity={1}
                      castShadow
                      shadow-mapSize-width={2048}
                      shadow-mapSize-height={2048}
                    />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />

                    <Model3D url={product.modelUrl} isRotating={isRotating} />

                    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
                      <planeGeometry args={[20, 20]} />
                      <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.2} />
                    </mesh>

                    <gridHelper args={[20, 20, "#334155", "#1e293b"]} position={[0, -1.99, 0]} />

                    <OrbitControls
                      enablePan={true}
                      enableZoom={true}
                      enableRotate={true}
                      minDistance={2}
                      maxDistance={50}
                      target={[0, 0, 0]}
                    />
                  </Suspense>
                </Canvas>
              </div>

              {/* 模型控制按钮 */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Button
                  onClick={() => setIsRotating(!isRotating)}
                  size="sm"
                  className={isRotating ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"}
                >
                  {isRotating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  size="sm"
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* 操作提示 */}
            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p>• 鼠标左键拖拽：旋转视角</p>
              <p>• 鼠标右键拖拽：平移视角</p>
              <p>• 滚轮：缩放模型</p>
            </div>
          </div>

          {/* 商品信息区域 */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-cyan-500 text-white text-sm rounded-full">
                  {product.category}
                </span>
                {product.isPurchased && (
                  <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    已购买
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-bold text-white mb-4">
                {product.name}
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="border-t border-gray-800 pt-6">
              <div className="text-5xl font-bold text-cyan-400 mb-6">
                ¥{product.price}
              </div>

              <div className="space-y-3">
                {product.isPurchased ? (
                  <Button
                    onClick={handleDownload}
                    className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    下载模型文件
                  </Button>
                ) : (
                  <Button
                    onClick={handlePurchase}
                    disabled={purchasingId === product.id}
                    className="w-full h-14 text-lg bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    {purchasingId === product.id ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        立即购买
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* 商品详情 */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">商品信息</h3>
                <div className="space-y-3 text-gray-400">
                  <div className="flex justify-between">
                    <span>分类</span>
                    <span className="text-white">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>格式</span>
                    <span className="text-white">{product.modelUrl.split('.').pop()?.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>状态</span>
                    <span className={product.isPurchased ? "text-green-400" : "text-yellow-400"}>
                      {product.isPurchased ? "已购买" : "未购买"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="py-12 bg-gray-900 border-t border-gray-800 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2025 3D Studio. 保留所有权利。</p>
        </div>
      </footer>

      {/* 二维码支付弹窗 */}
      {showQRCode && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
          onClick={paymentStatus === "success" ? closeQRCodeModal : undefined}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
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
      )}
    </div>
  )
}
