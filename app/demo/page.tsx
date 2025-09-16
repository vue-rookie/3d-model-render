"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Html, Text } from "@react-three/drei"
import { Suspense, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
const modelConfig = {
  name: "火星",
  url: "/mars.glb",
  description: "火星地表模型",
  scale: 1,
  position: [0, -1, 0],
}

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center space-y-4 text-white min-w-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        <p className="text-lg">加载3D模型中...</p>
      </div>
    </Html>
  )
}

function DemoModel() {
  const modelRef = useRef<any>(null)
  const [loadError, setLoadError] = useState(false)
  const gltf = useGLTF(modelConfig.url, true)

 

  const scene = gltf.scene
  if (loadError || !scene) {
    return <FallbackModel />
  }

  return (
    <>
      <primitive 
        ref={modelRef} 
        object={scene} 
        scale={modelConfig.scale} 
        position={modelConfig.position} 
        rotation={modelConfig.rotation} 
      />
    </>
  )
}

function FallbackModel() {
  const meshRef = useRef<any>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.3
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <>
      <mesh ref={meshRef} castShadow>
        <torusKnotGeometry args={[1, 0.3, 128, 16]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.8} roughness={0.2} />
      </mesh>
      <Text position={[0, -3, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
        备用演示模型
      </Text>
    </>
  )
}

export default function DemoPage() {

  return (
    <div className="min-h-screen bg-slate-800 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300">
            <ArrowLeft className="h-5 w-5" />
            <span>返回首页</span>
          </Link>
          <h1 className="text-xl font-bold">3D模型演示</h1>
        </div>
      </header>

      {/* 3D Scene */}
      <div className="h-screen relative">
        <Canvas shadows camera={{ position: [0, 0, 8], fov: 50 }} className="bg-gradient-to-b from-slate-700 to-slate-900">
          <Suspense fallback={<LoadingSpinner />}>
            {/* 使用本地环境光照替代外部HDRI */}
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1.2}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <spotLight position={[-10, 10, 5]} angle={0.3} penumbra={1} intensity={0.7} castShadow />

            <DemoModel />

            {/* Ground */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#334155" roughness={0.8} metalness={0.1} />
            </mesh>

            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={2} maxDistance={10} />
          </Suspense>
        </Canvas>

        {/* Info Panel */}
        <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md rounded-lg p-4 max-w-sm">
          <h3 className="text-lg font-bold mb-2 text-cyan-400">操作说明</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• 鼠标左键拖拽：旋转视角</li>
            <li>• 鼠标右键拖拽：平移视角</li>
            <li>• 滚轮：缩放</li>
            <li>• 点击模型上方按钮控制动画</li>
            <li>• 右上角选择不同的3D模型</li>
          </ul>
        </div>

        {/* Model Info */}
        <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-md rounded-lg p-4 max-w-sm">
          <h3 className="text-lg font-bold mb-2 text-cyan-400">模型信息</h3>
          <div className="text-sm text-gray-300 space-y-1">
            <p>
              <strong>名称:</strong> {modelConfig.name}
            </p>
            <p>
              <strong>格式:</strong> OBJ
            </p>
            <p>
              <strong>来源:</strong> Three.js 官方示例
            </p>
            <p>
              <strong>特性:</strong> PBR材质、阴影、动画
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
