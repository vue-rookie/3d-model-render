"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Sphere, Box, Torus } from "@react-three/drei"
import { Suspense, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Cable as Cube, User, Zap, Play } from "lucide-react"

function AnimatedGeometry() {
  const sphereRef = useRef<any>()
  const boxRef = useRef<any>()
  const torusRef = useRef<any>()

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
            <a href="#examples" className="text-gray-300 hover:text-white transition-colors">
              示例
            </a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">
              关于
            </a>
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
              <Environment preset="night" />
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
          <Link href="/models">
            <Button size="lg" className="text-lg px-8 py-4 bg-white  hover:bg-gray-100">
              开始探索 <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-12 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Cube className="h-6 w-6 text-cyan-400" />
              <span className="text-lg font-semibold text-white">3D Studio</span>
            </div>
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                文档
              </a>
              <a href="#" className="hover:text-white transition-colors">
                支持
              </a>
              <a href="#" className="hover:text-white transition-colors">
                GitHub
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 3D Studio. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
