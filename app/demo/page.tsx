"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Html, Text, useProgress, Stats, meshBounds } from "@react-three/drei"
import { Suspense, useState, useEffect } from "react"
import * as THREE from "three"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
const modelConfig = {
  name: "火星",
  url: "/mars.glb",
  description: "火星地表模型",
  scale: 0.5,
  position: [0, -2, 0],
}

function LoadingSpinner() {
  const { progress, total, loaded, item } = useProgress()
  
  return (
    <Html center>
      <div className="flex flex-col items-center space-y-4 text-white min-w-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        <p className="text-lg">加载3D模型中...</p>
        <div className="w-48 bg-slate-700 rounded-full h-2.5 mt-2">
          <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </Html>
  )
}

// 设置模型缓存
const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'

// 预加载模型
useGLTF.preload(modelConfig.url)

function DemoModel() {
  const modelRef = useRef<any>(null)
  const [loadError, setLoadError] = useState(false)
  
  // 使用draco压缩器加快加载速度
  const gltf = useGLTF(modelConfig.url, true, true)

  useEffect(() => {
    // 错误处理
    if (!gltf) {
      setLoadError(true)
    }
  }, [gltf])

  const scene = gltf?.scene
  if (loadError || !scene) {
    return <FallbackModel />
  }

  // 优化模型
  useEffect(() => {
    if (scene) {
      // 遍历场景中的所有对象，应用性能优化
      scene.traverse((object) => {
        // 禁用不必要的阴影
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh
          // 降低阴影质量
          mesh.castShadow = true
          mesh.receiveShadow = true
          
          // 优化材质
          if (mesh.material) {
            const material = mesh.material as THREE.Material
            // 设置为低精度
            if ('precision' in material) {
              (material as any).precision = 'lowp'
            }
          }
        }
      })
    }
  }, [scene])

  return (
    <>
      <primitive 
        ref={modelRef} 
        object={scene} 
        scale={modelConfig.scale} 
        position={modelConfig.position} 
        raycast={meshBounds} // 使用简化的射线检测
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
  // 延迟加载模型
  const [showModel, setShowModel] = useState(false)
  const [isLowPerformance, setIsLowPerformance] = useState(false)
  
  useEffect(() => {
    // 检测设备性能
    const checkPerformance = () => {
      // 检查是否为移动设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      // 检查GPU性能 - 简化检测
      let isLowPower = false
      
      // 检测是否为低端设备
      if (typeof window !== 'undefined') {
        // 检查设备内存 (如果可用)
        if ('deviceMemory' in navigator) {
          isLowPower = (navigator as any).deviceMemory < 4
        }
        
        // 检查硬件并发性
        if ('hardwareConcurrency' in navigator) {
          isLowPower = isLowPower || navigator.hardwareConcurrency < 4
        }
      }
      
      // 如果是移动设备或低性能GPU，启用低性能模式
      setIsLowPerformance(isMobile || isLowPower)
    }
    
    checkPerformance()
    
    // 延迟200ms加载模型，让页面先渲染
    const timer = setTimeout(() => {
      setShowModel(true)
    }, 200)
    
    return () => clearTimeout(timer)
  }, [])

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
        <Canvas 
          shadows
          camera={{ position: [-10, 1, 1], fov: 50 }} 
          className="bg-gradient-to-b from-slate-700 to-slate-900"
          dpr={[1, 2]} // 限制像素比，优化移动设备性能
          performance={{ min: 0.5 }} // 性能模式
          gl={{ 
            powerPreference: 'high-performance',
            antialias: false, // 禁用抗锯齿
            depth: true,
            stencil: false,
            alpha: false
          }}
        >
          <Suspense fallback={<LoadingSpinner />}>
            {/* 性能监控 */}
            <Stats />
            
            {/* 使用本地环境光照替代外部HDRI */}
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1.2}
              castShadow
              shadow-mapSize-width={512} // 降低阴影贴图分辨率
              shadow-mapSize-height={512}
            />

            {showModel && <DemoModel />}

            {/* Ground - 简化地面 */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
              <planeGeometry args={[20, 20]} />
              <meshBasicMaterial color="#334155" /> {/* 使用BasicMaterial代替StandardMaterial */}
            </mesh>

            <OrbitControls 
              enablePan={true} 
              enableZoom={true} 
              enableRotate={true} 
              minDistance={4} 
              maxDistance={20}
              minPolarAngle={-2}
              maxPolarAngle={Math.PI / 2.5}
              target={[0, -2, 0]}
            />
          </Suspense>
        </Canvas>

        {/* Info Panel */}
        <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md rounded-lg p-4 max-w-sm">
          <h3 className="text-lg font-bold mb-2 text-cyan-400">操作说明</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• 鼠标左键拖拽：旋转视角</li>
            <li>• 鼠标右键拖拽：平移视角</li>
            <li>• 滚轮：缩放</li>
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
