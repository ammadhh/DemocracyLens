"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

export function PoliticalSpectrumSlider() {
  const [value, setValue] = useState([0]) // 0 = center, -50 = far left, 50 = far right

  const getPositionLabel = (value: number) => {
    if (value < -30) return "Far Left"
    if (value < -10) return "Left"
    if (value < 10) return "Center"
    if (value < 30) return "Right"
    return "Far Right"
  }

  const getPositionColor = (value: number) => {
    if (value < -30) return "bg-blue-600 hover:bg-blue-700"
    if (value < -10) return "bg-blue-500 hover:bg-blue-600"
    if (value < 10) return "bg-purple-500 hover:bg-purple-600"
    if (value < 30) return "bg-red-500 hover:bg-red-600"
    return "bg-red-600 hover:bg-red-700"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Political Spectrum Filter</CardTitle>
        <CardDescription>Adjust to see news from different political perspectives</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between px-1 text-sm">
            <span>Liberal</span>
            <span>Neutral</span>
            <span>Conservative</span>
          </div>

          <Slider
            defaultValue={[0]}
            min={-50}
            max={50}
            step={1}
            value={value}
            onValueChange={setValue}
            className="py-4"
          />

          <div className="flex justify-center">
            <Badge className={`${getPositionColor(value[0])} px-3 py-1`}>{getPositionLabel(value[0])}</Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            {value[0] < -10
              ? "Showing more liberal-leaning news sources and perspectives."
              : value[0] > 10
                ? "Showing more conservative-leaning news sources and perspectives."
                : "Showing balanced news sources from across the political spectrum."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

