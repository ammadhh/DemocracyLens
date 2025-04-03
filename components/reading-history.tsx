"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Trash2, RefreshCw } from "lucide-react"
import { getGuestId } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { format } from "date-fns"

type ReadingHistoryItem = {
  id: string
  read_at: string
  article: {
    id: string
    title: string
    source: string
    source_type: "left" | "center" | "right"
    political_score?: number
    url: string
  }
}

export function ReadingHistory() {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchReadingHistory = async () => {
    setLoading(true)
    setError(null)

    try {
      const guestId = await getGuestId()
      const response = await fetch(`/api/reading-history?guestId=${guestId}&limit=5`)

      if (!response.ok) {
        throw new Error("Failed to fetch reading history")
      }

      const data = await response.json()

      if (data.success) {
        setHistory(data.data)
      } else {
        throw new Error(data.error || "Failed to fetch reading history")
      }
    } catch (error: any) {
      console.error("Error fetching reading history:", error)
      setError(error.message || "Failed to load reading history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReadingHistory()

    // Listen for refresh events
    const handleRefresh = () => {
      fetchReadingHistory()
    }

    window.addEventListener("refreshReadingData", handleRefresh)

    return () => {
      window.removeEventListener("refreshReadingData", handleRefresh)
    }
  }, [])

  const clearReadingHistory = async () => {
    try {
      const guestId = await getGuestId()
      const response = await fetch(`/api/reading-history?guestId=${guestId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to clear reading history")
      }

      const data = await response.json()

      if (data.success) {
        setHistory([])
        toast({
          title: "Reading history cleared",
          description: "Your reading history has been cleared successfully.",
        })

        // Trigger refresh of other components
        const refreshEvent = new CustomEvent("refreshReadingData")
        window.dispatchEvent(refreshEvent)
      } else {
        throw new Error(data.error || "Failed to clear reading history")
      }
    } catch (error: any) {
      console.error("Error clearing reading history:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to clear reading history.",
        variant: "destructive",
      })
    }
  }

  const getPoliticalScoreColor = (score: number) => {
    if (score <= -7)
      return "border-blue-700 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
    if (score <= -3)
      return "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
    if (score < 3)
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
    if (score < 7)
      return "border-red-500 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300"
    return "border-red-700 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/70 dark:text-red-300"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Reading History</CardTitle>
          <CardDescription>Your recent news consumption</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchReadingHistory} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={clearReadingHistory} title="Clear History">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-4/5" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            <p className="font-medium">Error loading reading history</p>
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchReadingHistory} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground">No reading history yet</p>
            <p className="text-sm text-muted-foreground mt-1">Articles you read will appear here</p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <Link href="/news">Browse News</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium">
                    <Link href={item.article.url} target="_blank" className="hover:underline">
                      {item.article.title}
                    </Link>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{item.article.source}</span>
                    {item.article.political_score !== undefined && (
                      <Badge variant="outline" className={getPoliticalScoreColor(item.article.political_score)}>
                        {item.article.political_score.toFixed(1)}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`
                        ${item.article.source_type === "left" ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300" : ""}
                        ${item.article.source_type === "center" ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300" : ""}
                        ${item.article.source_type === "right" ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300" : ""}
                      `}
                    >
                      {item.article.source_type === "left"
                        ? "Liberal"
                        : item.article.source_type === "right"
                          ? "Conservative"
                          : "Neutral"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(item.read_at), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

