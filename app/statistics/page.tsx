"use client"

import { useEffect, useState } from "react"
import { useSidebar } from "@/components/sidebar-provider"

export default function StatisticsPage() {
  const { open, isMobile } = useSidebar()
  const [iframeHeight, setIframeHeight] = useState("calc(100vh - 2rem)")

  // Adjust iframe height based on window size
  useEffect(() => {
    const handleResize = () => {
      setIframeHeight(`calc(100vh - 2rem)`)
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="w-full h-full pt-16 md:pt-6">
      <div className="px-4 md:px-6 mb-4">
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-muted-foreground">Explore democratic engagement data</p>
      </div>

      <div className="w-full h-full px-4 md:px-6">
        <div className="w-full h-full border rounded-lg overflow-hidden bg-white">
          <iframe
            src="https://devchartsdatadriven.streamlit.app/?embed=true"
            title="Democracy Statistics Dashboard"
            className="w-full border-0"
            style={{ height: iframeHeight }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}

