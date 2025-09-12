"use client"

import type React from "react"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, PerspectiveCamera, useGLTF, useFBX, Html, Text } from "@react-three/drei"
import { Suspense, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import {
  Upload,
  RotateCcw,
  ZoomIn,
  Move3D,
  Play,
  Pause,
  RotateCw,
  MoveVertical,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react"
import type * as THREE from "three"

function cubicBezier(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  const cx = 3 * p1x
  const bx = 3 * (p2x - p1x) - cx
  const ax = 1 - cx - bx

  const cy = 3 * p1y
  const by = 3 * (p2y - p1y) - cy
  const ay = 1 - cy - by

  function sampleCurveX(t: number) {
    return ((ax * t + bx) * t + cx) * t
  }

  function sampleCurveY(t: number) {
    return ((ay * t + by) * t + cy) * t
  }

  function solveCurveX(x: number) {
    let t0, t1, t2, x2, d2, i

    for (t2 = x, i = 0; i < 8; i++) {
      x2 = sampleCurveX(t2) - x
      if (Math.abs(x2) < 1e-6) return t2
      d2 = (3 * ax * t2 + 2 * bx) * t2 + cx
      if (Math.abs(d2) < 1e-6) break
      t2 = t2 - x2 / d2
    }

    t0 = 0
    t1 = 1
    t2 = x

    if (t2 < t0) return t0
    if (t2 > t1) return t1

    while (t0 < t1) {
      x2 = sampleCurveX(t2)
      if (Math.abs(x2 - x) < 1e-6) return t2
      if (x > x2) t0 = t2
      else t1 = t2
      t2 = (t1 - t0) * 0.5 + t0
    }

    return t2
  }

  return sampleCurveY(solveCurveX(t))
}

function BezierCurveEditor({
  onCurveChange,
  initialCurve = [0.25, 0.1, 0.25, 1],
}: {
  onCurveChange: (curve: number[]) => void
  initialCurve?: number[]
}) {
  const [curve, setCurve] = useState(initialCurve)
  const [isDragging, setIsDragging] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const handleMouseDown = (pointIndex: number) => {
    setIsDragging(pointIndex)
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging === null || !svgRef.current) return

      const rect = svgRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))

      const newCurve = [...curve]
      if (isDragging === 0) {
        newCurve[0] = x
        newCurve[1] = y
      } else if (isDragging === 1) {
        newCurve[2] = x
        newCurve[3] = y
      }

      setCurve(newCurve)
      onCurveChange(newCurve)
    },
    [isDragging, curve, onCurveChange],
  )

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  // 预设曲线
  const presets = [
    { name: "线性", curve: [0, 0, 1, 1] },
    { name: "缓入", curve: [0.42, 0, 1, 1] },
    { name: "缓出", curve: [0, 0, 0.58, 1] },
    { name: "缓入缓出", curve: [0.42, 0, 0.58, 1] },
    { name: "弹性", curve: [0.68, -0.55, 0.265, 1.55] },
  ]

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400 mb-2">自定义动画曲线</div>

      {/* 曲线编辑器 */}
      <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
        <svg
          ref={svgRef}
          width="100%"
          height="120"
          viewBox="0 0 1 1"
          className="border border-slate-500 bg-slate-900 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 网格线 */}
          <defs>
            <pattern id="grid" width="0.1" height="0.1" patternUnits="userSpaceOnUse">
              <path d="M 0.1 0 L 0 0 0 0.1" fill="none" stroke="#374151" strokeWidth="0.005" />
            </pattern>
          </defs>
          <rect width="1" height="1" fill="url(#grid)" />

          {/* 贝塞尔曲线 */}
          <path
            d={`M 0 1 C ${curve[0]} ${1 - curve[1]} ${curve[2]} ${1 - curve[3]} 1 0`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="0.01"
          />

          {/* 控制点 */}
          <circle
            cx={curve[0]}
            cy={1 - curve[1]}
            r="0.02"
            fill="#3b82f6"
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={() => handleMouseDown(0)}
          />
          <circle
            cx={curve[2]}
            cy={1 - curve[3]}
            r="0.02"
            fill="#3b82f6"
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={() => handleMouseDown(1)}
          />

          {/* 控制线 */}
          <line
            x1="0"
            y1="1"
            x2={curve[0]}
            y2={1 - curve[1]}
            stroke="#6b7280"
            strokeWidth="0.005"
            strokeDasharray="0.02,0.01"
          />
          <line
            x1="1"
            y1="0"
            x2={curve[2]}
            y2={1 - curve[3]}
            stroke="#6b7280"
            strokeWidth="0.005"
            strokeDasharray="0.02,0.01"
          />
        </svg>

        {/* 数值显示 */}
        <div className="text-xs text-gray-400 mt-2">cubic-bezier({curve.map((v) => v.toFixed(2)).join(", ")})</div>
      </div>

      {/* 预设曲线 */}
      <div className="grid grid-cols-2 gap-1">
        {presets.map((preset, index) => (
          <Button
            key={index}
            onClick={() => {
              setCurve(preset.curve)
              onCurveChange(preset.curve)
            }}
            size="sm"
            variant="outline"
            className="border-slate-600 text-white hover:bg-slate-700 bg-transparent text-xs"
          >
            {preset.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

function AnimatedModel({
  children,
  isRotating,
  rotationSpeed,
  animationType,
  customCurve,
}: {
  children: React.ReactNode
  isRotating: boolean
  rotationSpeed: number
  animationType: string
  customCurve: number[]
}) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!meshRef.current) return

    if (isRotating) {
      meshRef.current.rotation.y += delta * rotationSpeed
    }

    const time = state.clock.elapsedTime
    const normalizedTime = (time % 2) / 2 // 2秒循环
    const easedTime = cubicBezier(normalizedTime, customCurve[0], customCurve[1], customCurve[2], customCurve[3])

    // 不同的动画类型
    switch (animationType) {
      case "float":
        meshRef.current.position.y = (easedTime - 0.5) * 1
        break
      case "bounce":
        meshRef.current.position.y = Math.abs(easedTime - 0.5) * 1.6
        break
      case "swing":
        meshRef.current.rotation.z = (easedTime - 0.5) * 0.4
        break
      case "custom":
        // 自定义动画：结合位置和旋转
        meshRef.current.position.y = (easedTime - 0.5) * 0.8
        meshRef.current.rotation.z = (easedTime - 0.5) * 0.3
        break
      default:
        if (!isRotating) {
          meshRef.current.position.y = 0
          meshRef.current.rotation.z = 0
        }
    }
  })

  return <group ref={meshRef}>{children}</group>
}

function FBXModel({
  url,
  position,
  isRotating,
  rotationSpeed,
  animationType,
  customCurve,
}: {
  url: string
  position: [number, number, number]
  isRotating: boolean
  rotationSpeed: number
  animationType: string
  customCurve: number[]
}) {
  const fbx = useFBX(url)
  console.log("[v0] FBX model loaded successfully:", url)
  return (
    <AnimatedModel
      isRotating={isRotating}
      rotationSpeed={rotationSpeed}
      animationType={animationType}
      customCurve={customCurve}
    >
      <primitive object={fbx} position={position} scale={[0.01, 0.01, 0.01]} />
    </AnimatedModel>
  )
}

function GLTFModel({
  url,
  position,
  isRotating,
  rotationSpeed,
  animationType,
  customCurve,
}: {
  url: string
  position: [number, number, number]
  isRotating: boolean
  rotationSpeed: number
  animationType: string
  customCurve: number[]
}) {
  const { scene } = useGLTF(url)
  console.log("[v0] GLTF model loaded successfully:", url)
  return (
    <AnimatedModel
      isRotating={isRotating}
      rotationSpeed={rotationSpeed}
      animationType={animationType}
      customCurve={customCurve}
    >
      <primitive object={scene} position={position} scale={[1, 1, 1]} />
    </AnimatedModel>
  )
}

function Model3D({
  url,
  fileExtension,
  position = [0, 0, 0],
  isRotating,
  rotationSpeed,
  animationType,
  customCurve,
}: {
  url: string
  fileExtension: string
  position?: [number, number, number]
  isRotating: boolean
  rotationSpeed: number
  animationType: string
  customCurve: number[]
}) {
  console.log("[v0] Attempting to load model:", url, "Extension:", fileExtension)

  if (fileExtension === "fbx") {
    return (
      <FBXModel
        url={url}
        position={position}
        isRotating={isRotating}
        rotationSpeed={rotationSpeed}
        animationType={animationType}
        customCurve={customCurve}
      />
    )
  } else if (fileExtension === "glb" || fileExtension === "gltf") {
    return (
      <GLTFModel
        url={url}
        position={position}
        isRotating={isRotating}
        rotationSpeed={rotationSpeed}
        animationType={animationType}
        customCurve={customCurve}
      />
    )
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
      <div className="bg-blue-600/90 text-white p-6 rounded-xl backdrop-blur-sm border border-blue-400/30">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg font-semibold">加载3D模型中...</p>
        <p className="text-sm opacity-80">请稍候</p>
      </div>
    </Html>
  )
}

// 预设模型列表
const presetModels = [
  {
    name: "橡皮鸭",
    url: "/assets/3d/duck.glb",
    description: "经典橡皮鸭模型",
  },
]

export default function ModelsPage() {
  const [currentModel, setCurrentModel] = useState<string>("")
  const [modelName, setModelName] = useState<string>("选择一个模型")
  const [currentExtension, setCurrentExtension] = useState<string>("")
  const [isRotating, setIsRotating] = useState<boolean>(false)
  const [rotationSpeed, setRotationSpeed] = useState<number>(1)
  const [animationType, setAnimationType] = useState<string>("none")
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false)
  const [customCurve, setCustomCurve] = useState<number[]>([0.25, 0.1, 0.25, 1])
  const [showCurveEditor, setShowCurveEditor] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedFormats = ["glb", "gltf", "fbx"]
      const fileExtension = file.name.toLowerCase().split(".").pop()

      console.log("[v0] File selected:", file.name, "Size:", file.size, "Type:", file.type)

      if (!fileExtension || !allowedFormats.includes(fileExtension)) {
        alert(`不支持的文件格式: ${fileExtension}\n请上传 GLB, GLTF 或 FBX 文件。`)
        return
      }

      // 检查文件大小 (限制为50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert("文件太大，请选择小于50MB的文件。")
        return
      }

      const url = URL.createObjectURL(file)
      setCurrentModel(url)
      setModelName(file.name)
      setCurrentExtension(fileExtension)
      console.log("[v0] Loading file:", file.name, "Extension:", fileExtension)
    }
  }

  const loadPresetModel = (model: (typeof presetModels)[0]) => {
    setCurrentModel(model.url)
    setModelName(model.name)
    const extension = model.url.toLowerCase().split(".").pop() || "glb"
    setCurrentExtension(extension)
    console.log("[v0] Loading preset model:", model.name)
  }

  const resetView = () => {
    // 这里可以添加重置相机视角的逻辑
    window.location.reload()
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 3D场景 */}
      <Canvas shadows>
        <Suspense fallback={<LoadingIndicator />}>
          <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={60} />

          {/* 环境和光照 */}
          <Environment preset="studio" />
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* 显示当前模型 */}
          {currentModel && (
            <Model3D
              url={currentModel}
              fileExtension={currentExtension}
              isRotating={isRotating}
              rotationSpeed={rotationSpeed}
              animationType={animationType}
              customCurve={customCurve}
            />
          )}

          {/* 地面 */}
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.2} />
          </mesh>

          {/* 网格线 */}
          <gridHelper args={[20, 20, "#334155", "#1e293b"]} position={[0, -1.99, 0]} />

          {/* 控制器 */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={50}
            target={[0, 0, 0]}
          />

          {/* 模型名称显示 */}
          {currentModel && (
            <Text position={[0, 3, 0]} fontSize={0.5} color="#ffffff" anchorX="center" anchorY="middle">
              {modelName}
            </Text>
          )}
        </Suspense>
      </Canvas>

      <div
        className={`absolute top-4 left-4 transition-transform duration-300 ease-in-out ${isPanelCollapsed ? "-translate-x-72" : "translate-x-0"}`}
      >
        <div className="flex items-start">
          <Card className="bg-black/80 border-slate-600 backdrop-blur-sm w-80">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Move3D className="w-5 h-5" />
                3D模型加载器
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 文件上传 */}
              <div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  上传3D模型
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,.gltf,.fbx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-1">支持格式: GLB, GLTF, FBX</p>
              </div>

              {/* 预设模型 */}
              <div>
                <h3 className="text-white text-sm font-semibold mb-2">预设模型</h3>
                <div className="space-y-2">
                  {presetModels.map((model, index) => (
                    <Button
                      key={index}
                      onClick={() => loadPresetModel(model)}
                      variant="outline"
                      className="w-full justify-start text-left border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
                    >
                      <div>
                        <div className="font-medium text-white">{model.name}</div>
                        <div className="text-xs text-gray-300">{model.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {currentModel && (
                <div className="border-t border-slate-600 pt-4">
                  <h3 className="text-white text-sm font-semibold mb-3">动画控制</h3>

                  {/* 旋转控制 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setIsRotating(!isRotating)}
                        size="sm"
                        variant={isRotating ? "default" : "outline"}
                        className={
                          isRotating
                            ? "bg-green-600 hover:bg-green-700"
                            : "border-slate-600 text-white hover:bg-slate-700 bg-transparent"
                        }
                      >
                        {isRotating ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                        {isRotating ? "暂停旋转" : "开始旋转"}
                      </Button>
                    </div>

                    {/* 旋转速度 */}
                    {isRotating && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                          旋转速度: {rotationSpeed.toFixed(1)}x
                        </label>
                        <Slider
                          value={[rotationSpeed]}
                          onValueChange={(value) => setRotationSpeed(value[0])}
                          min={0.1}
                          max={3}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* 动画类型 */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">动画效果</label>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { type: "none", label: "无", icon: RotateCcw },
                          { type: "float", label: "浮动", icon: MoveVertical },
                          { type: "bounce", label: "弹跳", icon: MoveVertical },
                          { type: "swing", label: "摆动", icon: RotateCw },
                        ].map(({ type, label, icon: Icon }) => (
                          <Button
                            key={type}
                            onClick={() => setAnimationType(type)}
                            size="sm"
                            variant={animationType === type ? "default" : "outline"}
                            className={
                              animationType === type
                                ? "bg-blue-600 hover:bg-blue-700 text-xs"
                                : "border-slate-600 text-white hover:bg-slate-700 bg-transparent text-xs"
                            }
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {label}
                          </Button>
                        ))}
                      </div>

                      <div className="mt-2 space-y-2">
                        <Button
                          onClick={() => setAnimationType("custom")}
                          size="sm"
                          variant={animationType === "custom" ? "default" : "outline"}
                          className={
                            animationType === "custom"
                              ? "bg-purple-600 hover:bg-purple-700 text-xs w-full"
                              : "border-slate-600 text-white hover:bg-slate-700 bg-transparent text-xs w-full"
                          }
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          自定义动画
                        </Button>

                        {animationType !== "none" && (
                          <Button
                            onClick={() => setShowCurveEditor(!showCurveEditor)}
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-white hover:bg-slate-700 bg-transparent text-xs w-full"
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            {showCurveEditor ? "隐藏" : "显示"}曲线编辑器
                          </Button>
                        )}
                      </div>
                    </div>

                    {showCurveEditor && animationType !== "none" && (
                      <BezierCurveEditor onCurveChange={setCustomCurve} initialCurve={customCurve} />
                    )}
                  </div>
                </div>
              )}

              {/* 控制按钮 */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={resetView}
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  重置视角
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
                  disabled
                >
                  <ZoomIn className="w-4 h-4 mr-1" />
                  缩放
                </Button>
              </div>

              {/* 使用说明 */}
              <div className="text-xs text-gray-400 space-y-1">
                <p>• 鼠标左键拖拽：旋转视角</p>
                <p>• 鼠标右键拖拽：平移视角</p>
                <p>• 滚轮：缩放模型</p>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            size="sm"
            variant="outline"
            className="ml-2 mt-4 border-slate-600 text-white hover:bg-slate-700 bg-black/80 backdrop-blur-sm"
          >
            {isPanelCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* 返回按钮 */}
      <div className="absolute top-4 right-4">
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-700 bg-black/80 backdrop-blur-sm"
        >
          返回主页
        </Button>
      </div>

      {/* 状态显示 */}
      {!currentModel && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <Card className="bg-black/80 border-slate-600 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-white text-center">请上传3D模型文件或选择预设模型开始体验</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
