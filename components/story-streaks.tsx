"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FlameIcon as Fire } from "lucide-react"
import { cn } from "@/lib/utils"
import { getGuestId, getUserReadingHistory } from "@/lib/supabase"
import { getReadingStreakData } from "@/lib/democracy-utils"
import { Skeleton } from "@/components/ui/skeleton"

export function StoryStreaks() {
  const [loading, setLoading] = useState(true)
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    daysInMonth: [] as {
      date: Date
      day: number
      hasStreak: boolean
      streakIntensity: number
      isToday: boolean
    }[],
  })

  useEffect(() => {
    async function fetchStreakData() {
      try {
        const guestId = await getGuestId()
        const history = await getUserReadingHistory(guestId, 100, 0)

        const data = getReadingStreakData(history)
        setStreakData(data)
      } catch (error) {
        console.error("Error fetching streak data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStreakData()
  }, [])

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Story Streaks</CardTitle>
          <div className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-sm font-medium text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            <Fire className="h-4 w-4" />
            <span>{streakData.currentStreak} days</span>
          </div>
        </div>
        <CardDescription>Track your balanced news consumption</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div key={i} className="font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Add empty cells for days before the 1st of the month */}
              {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8 rounded-md"></div>
              ))}

              {streakData.daysInMonth.map((day) => (
                <div
                  key={day.day}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md text-xs font-medium",
                    day.isToday && "ring-2 ring-primary ring-offset-2",
                    day.hasStreak
                      ? day.streakIntensity === 1
                        ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                        : day.streakIntensity === 2
                          ? "bg-orange-200 text-orange-700 dark:bg-orange-800/40 dark:text-orange-300"
                          : "bg-orange-300 text-orange-800 dark:bg-orange-700/50 dark:text-orange-200"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {day.day}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Current Streak</span>
                <span className="font-medium">{streakData.currentStreak} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Longest Streak</span>
                <span className="font-medium">{streakData.longestStreak} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>This Month</span>
                <span className="font-medium">{streakData.daysInMonth.filter((d) => d.hasStreak).length} days</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

