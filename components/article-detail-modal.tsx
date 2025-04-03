"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Bookmark, Clock, ExternalLink, Loader2, Share2, ThumbsDown, ThumbsUp } from "lucide-react"
import { getGuestId, trackArticleRead } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { CommentsSection } from "@/components/comments-section"
import type { Article } from "@/lib/supabase"

type NewsArticle = Article & {
  political_score?: number
  votes?: {
    upvotes: number
    downvotes: number
  }
  userVote?: "up" | "down" | null
}

type ArticleDetailModalProps = {
  article: NewsArticle | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ArticleDetailModal({ article, open, onOpenChange }: ArticleDetailModalProps) {
  const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0 })
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [politicalScore, setPoliticalScore] = useState<number | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tracked, setTracked] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("comments")
  const { toast } = useToast()

  useEffect(() => {
    if (article && open) {
      // Reset states
      setAiSummary(null)
      setPoliticalScore(article.political_score || null)
      setError(null)
      setTracked(false)
      setActiveTab("comments")

      // If article already has votes and userVote, use those
      if (article.votes && article.userVote !== undefined) {
        setVotes(article.votes)
        setUserVote(article.userVote)
        setLoading(false)
      } else {
        // Otherwise fetch them
        fetchVotes()
        checkUserVote()
      }

      // Analyze the article with OpenAI
      analyzeArticle()

      // Track that the user has read this article
      trackArticleRead()
    }
  }, [article, open])

  const fetchVotes = async () => {
    if (!article) return

    setLoading(true)
    try {
      const response = await fetch(`/api/votes?articleId=${article.id}`)
      const data = await response.json()

      if (data.success) {
        setVotes(data.data)
      }
    } catch (error) {
      console.error("Error fetching votes:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkUserVote = async () => {
    if (!article) return

    try {
      const guestId = await getGuestId()
      const response = await fetch(`/api/user-vote?articleId=${article.id}&guestId=${guestId}`)
      const data = await response.json()

      if (data.success) {
        setUserVote(data.data.voteType)
      }
    } catch (error) {
      console.error("Error checking user vote:", error)
    }
  }

  const analyzeArticle = async () => {
    if (!article) return

    setAnalyzing(true)
    try {
      const response = await fetch("/api/analyze-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: article.id,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Too many requests. Please try again later.")
        }
        throw new Error("Failed to analyze article")
      }

      const data = await response.json()

      if (data.success) {
        setAiSummary(data.data.summary)
        setPoliticalScore(data.data.politicalScore)
      } else {
        throw new Error(data.error || "Failed to analyze article")
      }
    } catch (error: any) {
      console.error("Error analyzing article:", error)
      setError(error.message || "Failed to analyze article")

      // If we don't have a political score yet, use the article's score
      if (politicalScore === null && article.political_score !== undefined) {
        setPoliticalScore(article.political_score)
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const trackArticleRead = async () => {
    if (!article || tracked) return

    try {
      const guestId = await getGuestId()
      await fetch("/api/reading-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: article.id,
          guestId,
        }),
      })
      setTracked(true)

      // Refresh challenges and streaks after tracking
      const refreshEvent = new CustomEvent("refreshReadingData")
      window.dispatchEvent(refreshEvent)
    } catch (error) {
      console.error("Error tracking article read:", error)
      // Don't show an error to the user, just log it
    }
  }

  const handleVote = async (voteType: "up" | "down") => {
    if (!article) return

    // Optimistic UI update
    const oldVote = userVote
    const newVote = userVote === voteType ? null : voteType

    setUserVote(newVote)
    setVotes((prev) => ({
      upvotes:
        voteType === "up"
          ? newVote
            ? prev.upvotes + 1
            : prev.upvotes - 1
          : oldVote === "up"
            ? prev.upvotes - 1
            : prev.upvotes,
      downvotes:
        voteType === "down"
          ? newVote
            ? prev.downvotes + 1
            : prev.downvotes - 1
          : oldVote === "down"
            ? prev.downvotes - 1
            : prev.downvotes,
    }))

    try {
      const guestId = await getGuestId()
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: article.id,
          guestId,
          voteType: newVote,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Too many requests. Please try again later.")
        }
        throw new Error("Failed to record vote")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to record vote")
      }
    } catch (error: any) {
      console.error("Error voting:", error)
      toast({
        title: "Error voting",
        description: error.message || "There was an error recording your vote.",
        variant: "destructive",
      })

      // Revert optimistic update on error
      checkUserVote()
      fetchVotes()
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

  if (!article) return null

  // Mock article content for demo if not provided
  const articleContent = article.content || `<p class="mb-4">${article.description}</p>`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="article-content">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{article.title}</DialogTitle>
          <DialogDescription className="sr-only" id="article-content">
            Article details and content
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">{article.source}</span>
            {politicalScore !== null && (
              <Badge variant="outline" className={getPoliticalScoreColor(politicalScore)}>
                Political Score: {politicalScore.toFixed(1)}
              </Badge>
            )}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(article.published_at).toLocaleString()}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Article Content Section */}
          <div className="space-y-4">
            {article.image_url && (
              <div className="overflow-hidden rounded-lg">
                <img
                  src={article.image_url || "/placeholder.svg"}
                  alt={article.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            <div className="space-y-4">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: articleContent }}
              />

              <div className="rounded-lg bg-muted p-4 my-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  AI Analysis
                  {analyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                </h4>

                {error ? (
                  <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Analysis Error</p>
                      <p className="text-muted-foreground">{error}</p>
                      <p className="mt-2">Using cached or estimated political score instead.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Political Score */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-4xl font-bold mb-2">
                        {analyzing ? (
                          <Loader2 className="h-8 w-8 animate-spin" />
                        ) : politicalScore !== null ? (
                          politicalScore.toFixed(1)
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Political score on a scale from -10 (very liberal) to +10 (very conservative)
                      </p>
                    </div>

                    {/* AI Summary */}
                    <div>
                      <h5 className="text-sm font-medium mb-1">AI Summary</h5>
                      <p className="text-sm text-muted-foreground">
                        {analyzing ? "Generating AI summary..." : aiSummary || "No summary available."}
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <Button variant="outline" size="sm" onClick={analyzeArticle} disabled={analyzing} className="mt-2">
                    {analyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Try Again"
                    )}
                  </Button>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant={userVote === "up" ? "default" : "outline"}
                        className="rounded-r-none gap-1 h-9"
                        onClick={() => handleVote("up")}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>Upvote</span>
                      </Button>
                      <div className="px-3 h-9 flex items-center justify-center border border-l-0 border-r-0">
                        {votes.upvotes}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant={userVote === "down" ? "default" : "outline"}
                        className="rounded-r-none gap-1 h-9"
                        onClick={() => handleVote("down")}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>Downvote</span>
                      </Button>
                      <div className="px-3 h-9 flex items-center justify-center border border-l-0">
                        {votes.downvotes}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Bookmark className="h-4 w-4" />
                      <span className="hidden sm:inline">Save</span>
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <Button asChild>
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="gap-1">
                    <span>Read Full Article on {article.source}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Comments</span>
            </div>
          </div>

          {/* Comments Section */}
          <div>{article && <CommentsSection articleId={article.id} />}</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

