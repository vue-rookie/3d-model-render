"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Html, Text } from "@react-three/drei"
import { Suspense, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Pause, ChevronDown } from "lucide-react"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"

const modelOptions = [
  {
    id: "helmet",
    name: "损坏的头盔",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf",
    description: "Three.js 官方PBR示例模型",
    scale: 2,
    position: [0, -1, 0],
  },
  {
    id: "duck",
    name: "橡皮鸭",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf",
    description: "经典的橡皮鸭模型",
    scale: 0.05,
    position: [0, -1, 0],
  },
  {
    id: "brain",
    name: "大脑模型",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF/BrainStem.gltf",
    description: "医学大脑干模型",
    scale: 10,
    position: [0, -1, 0],
  },
  {
    id: "car",
    name: "汽车模型",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF/AntiqueCamera.gltf",
    description: "古董相机模型",
    scale: 15,
    position: [0, -1, 0],
  },
  {
    id: "robot",
    name: "机器人",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedSimple/glTF/RiggedSimple.gltf",
    description: "简单绑定角色模型",
    scale: 1,
    position: [0, -2, 0],
  },
]

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

function DemoModel({ modelConfig }: { modelConfig: (typeof modelOptions)[0] }) {
  const modelRef = useRef<any>()
  const [isRotating, setIsRotating] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const gltf = useGLTF(modelConfig.url)

  useFrame((state) => {
    if (modelRef.current && isRotating) {
      modelRef.current.rotation.y += 0.01
    }
  })

  const scene = gltf.scene
  if (loadError || !scene) {
    return <FallbackModel />
  }

  return (
    <>
      <primitive ref={modelRef} object={scene} scale={modelConfig.scale} position={modelConfig.position} />
      <Html position={[0, 3, 0]} center>
        <div className="bg-black/80 backdrop-blur-md rounded-lg p-4 text-white text-center">
          <h3 className="text-lg font-bold mb-2">{modelConfig.name}</h3>
          <p className="text-sm text-gray-300 mb-3">{modelConfig.description}</p>
          <Button
            size="sm"
            onClick={() => setIsRotating(!isRotating)}
            className="bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            {isRotating ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {isRotating ? "暂停" : "播放"}
          </Button>
        </div>
      </Html>
    </>
  )
}

function FallbackModel() {
  const meshRef = useRef<any>()

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
  const [selectedModelId, setSelectedModelId] = useState("helmet")
  const [showModelSelector, setShowModelSelector] = useState(false)

  const selectedModel = modelOptions.find((model) => model.id === selectedModelId) || modelOptions[0]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300">
            <ArrowLeft className="h-5 w-5" />
            <span>返回首页</span>
          </Link>
          <h1 className="text-xl font-bold">3D模型演示</h1>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="border-gray-600 text-white hover:bg-gray-800 min-w-[140px] justify-between"
            >
              {selectedModel.name}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>

            {showModelSelector && (
              <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl min-w-[200px] z-10">
                {modelOptions.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModelId(model.id)
                      setShowModelSelector(false)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      selectedModelId === model.id ? "bg-cyan-500/20 text-cyan-400" : "text-white"
                    }`}
                  >
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-gray-400">{model.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3D Scene */}
      <div className="h-screen relative">
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }} className="bg-gradient-to-b from-gray-900 to-black">
          <Suspense fallback={<LoadingSpinner />}>
            {/* 使用本地环境光照替代外部HDRI */}
            <ambientLight intensity={0.3} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <spotLight position={[-10, 10, 5]} angle={0.3} penumbra={1} intensity={0.5} castShadow />

            <DemoModel key={selectedModelId} modelConfig={selectedModel} />

            {/* Ground */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#111111" roughness={0.8} metalness={0.1} />
            </mesh>

            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={2} maxDistance={10} />
          </Suspense>
        </Canvas>

        {/* Info Panel */}
        <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md rounded-lg p-4 max-w-sm">
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
        <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-md rounded-lg p-4 max-w-sm">
          <h3 className="text-lg font-bold mb-2 text-cyan-400">模型信息</h3>
          <div className="text-sm text-gray-300 space-y-1">
            <p>
              <strong>名称:</strong> {selectedModel.name}
            </p>
            <p>
              <strong>格式:</strong> GLTF
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
