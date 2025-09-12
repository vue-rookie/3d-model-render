"use client"

import { Html, useProgress } from "@react-three/drei"

export default function LoadingSpinner() {
  const { progress } = useProgress()

  return (
    <Html center>
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-white text-lg font-semibold">加载中... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  )
}
