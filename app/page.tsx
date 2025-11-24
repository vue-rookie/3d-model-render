"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Sphere, Box, Torus } from "@react-three/drei"
import { Suspense, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Cable as Cube, User, Zap, Play, Phone, MessageCircle, X, Copy, Check, LogOut } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"

function AnimatedGeometry() {
  const sphereRef = useRef<any>(null)
  const boxRef = useRef<any>(null)
  const torusRef = useRef<any>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (sphereRef.current) {
      sphereRef.current.rotation.x = time * 0.5
      sphereRef.current.rotation.y = time * 0.3
      sphereRef.current.position.y = Math.sin(time) * 0.5
    }
    if (boxRef.current) {
      boxRef.current.rotation.x = time * 0.3
      boxRef.current.rotation.z = time * 0.2
    }
    if (torusRef.current) {
      torusRef.current.rotation.x = time * 0.4
      torusRef.current.rotation.y = time * 0.6
    }
  })

  return (
    <>
      <Sphere ref={sphereRef} position={[-3, 2, 0]} args={[0.8]} castShadow>
        <meshStandardMaterial color="#06b6d4" metalness={0.8} roughness={0.2} />
      </Sphere>
      <Box ref={boxRef} position={[3, 1, -2]} args={[1.2, 1.2, 1.2]} castShadow>
        <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
      </Box>
      <Torus ref={torusRef} position={[0, -1, 2]} args={[1, 0.4, 16, 32]} castShadow>
        <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.2} />
      </Torus>
    </>
  )
}

export default function Home() {
  const [showContact, setShowContact] = useState(false)
  const [copied, setCopied] = useState(false)
  const { user, isLoggedIn, logout } = useAuth()

  const handleCopy = (text: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-black dark">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cube className="h-8 w-8 text-cyan-400" />
            <span className="text-xl font-bold text-white">3D Studio</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              功能
            </a>
            <Link href="/products" className="text-gray-300 hover:text-white transition-colors">
              商品列表
            </Link>
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="h-4 w-4" />
                  <span>{user?.username}</span>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="text-gray-300 border-gray-700 hover:text-white hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </Button>
              </>
            ) : (
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                登录
              </Link>
            )}
            <Link href="/models">
              <Button className="bg-white hover:bg-gray-800 text-black">开始使用</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Canvas shadows camera={{ position: [0, 0, 8], fov: 50 }}>
            <Suspense fallback={null}>
              {/* 使用本地环境光照替代外部HDRI */}
              <ambientLight intensity={0.2} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={0.8}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <AnimatedGeometry />
              <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#111111" roughness={0.8} metalness={0.1} />
              </mesh>
              <OrbitControls
                enablePan={false}
                enableZoom={false}
                enableRotate={true}
                autoRotate
                autoRotateSpeed={0.5}
              />
            </Suspense>
          </Canvas>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 animate-fade-in-up">3D模型在线渲染</h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            强大的3D模型查看器，支持多种格式，自定义动画，专业级渲染效果
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Link href="/models">
              <Button size="lg" className="cursor-pointer text-lg px-8 py-4 bg-white hover:opacity-90 text-black">
                立即开始 <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                
                size="lg"
                style={{ border: "1px solid white" }}
                className="cursor-pointer text-lg px-8 py-4 bg-transparent text-white hover:opacity-90 border-white"
              >
                <Play className="mr-2 h-5 w-5" />
                观看演示
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">强大功能</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">专为开发者和设计师打造的专业3D模型查看器</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-cyan-500/30 transition-colors">
                  <Cube className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">多格式支持</h3>
                <p className="text-gray-300">支持GLB、GLTF、FBX等主流3D模型格式，轻松导入各种类型的3D资源</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-500/30 transition-colors">
                  <Zap className="h-8 w-8 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">自定义动画</h3>
                <p className="text-gray-300">内置多种动画效果，支持贝塞尔曲线编辑器，创造独特的动画体验</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-red-500/30 transition-colors">
                  <User className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">用户友好</h3>
                <p className="text-gray-300">免费使用，无需注册，无需登录</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">准备开始了吗？</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">立即体验我们的3D模型查看器，探索无限的创意可能性</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="text-lg px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white">
                浏览商品 <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/models">
              <Button size="lg" className="text-lg px-8 py-4 bg-white hover:bg-gray-100 text-black">
                开始探索 <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 固定客服联系按钮 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button
          onClick={() => setShowContact(true)}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
          title="客服联系"
        >
          <Phone className="h-5 w-5" />
          <span className="hidden sm:inline">客服联系</span>
        </button>
      </div>

      {/* 客服联系弹窗 */}
      {showContact && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowContact(false)}
          />
          {/* 弹窗内容 */}
          <div className="fixed bottom-24 right-6 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6 w-80 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">客服联系</h3>
              <button
                onClick={() => setShowContact(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 电话 */}
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-full">
                    <Phone className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">电话</p>
                    <p className="text-white font-semibold">15525028182</p>
                  </div>
                </div>
               
              </div>

              {/* 微信 */}
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-full">
                    <MessageCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">微信</p>
                    <p className="text-white font-semibold">qq8181227</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy("qq8181227")}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      复制
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <footer className="py-12 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Cube className="h-6 w-6 text-cyan-400" />
              <span className="text-lg font-semibold text-white">3D Studio</span>
            </div>
            {/* <div className="flex items-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                文档
              </a>
              <a href="#" className="hover:text-white transition-colors">
                支持
              </a>
              <a href="#" className="hover:text-white transition-colors">
                GitHub
              </a>
            </div> */}
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <div className="mb-4">
              <p className="text-white font-semibold mb-2">客服联系</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a 
                  href="tel:15525028182" 
                  className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>电话：15525028182</span>
                </a>
                <span className="hidden sm:inline text-gray-600">|</span>
                <div className="flex items-center gap-2 text-gray-300">
                  <MessageCircle className="h-4 w-4" />
                  <span>微信：qq8181227</span>
                </div>
              </div>
            </div>
            <p>&copy; 2025 3D Studio. 保留所有权利。</p>
            <p>备案号：晋ICP备2025057905号</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
