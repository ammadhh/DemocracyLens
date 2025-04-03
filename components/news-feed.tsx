"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Bookmark, Clock, ExternalLink, ThumbsDown, ThumbsUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ArticleDetailModal } from "@/components/article-detail-modal"
import { NewsSearch } from "@/components/news-search"
import { getGuestId } from "@/lib/supabase"
import { format } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type NewsArticle = {
  id: string
  title: string
  description: string
  content?: string
  source: string
  source_type: "left" | "center" | "right"
  political_score?: number
  published_at: string
  url: string
  image_url?: string
  votes: {
    upvotes: number
    downvotes: number
  }
  userVote: "up" | "down" | null
}

export function NewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchDate, setSearchDate] = useState<Date | undefined>()
  const [sortBy, setSortBy] = useState("publishedAt")
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<"api" | "cache" | "cache_fallback" | null>(null)
  const observer = useRef<IntersectionObserver>()
  const { toast } = useToast()

  const lastArticleRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1)
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, hasMore],
  )

  useEffect(() => {
    fetchArticles(true)
  }, [searchQuery, searchDate, sortBy])

  useEffect(() => {
    if (page > 1) {
      fetchArticles(false)
    }
  }, [page])

  const handleSearch = (query: string, fromDate: Date | undefined, sort: string) => {
    setSearchQuery(query)
    setSearchDate(fromDate)
    setSortBy(sort)
    setPage(1)
  }

  const fetchArticles = async (reset = false) => {
    if (reset) {
      setLoading(true)
      setArticles([])
      setError(null)
    } else {
      setLoading(true)
    }

    try {
      // Build the query parameters
      const params = new URLSearchParams()
      params.append("page", page.toString())

      if (searchQuery) {
        params.append("q", searchQuery)
      }

      if (searchDate) {
        params.append("from", format(searchDate, "yyyy-MM-dd"))
      }

      params.append("sortBy", sortBy)

      // Get guest ID for user votes
      const guestId = await getGuestId()
      if (guestId) {
        params.append("guestId", guestId)
      }

      // Fetch articles from our API
      const response = await fetch(`/api/news?${params.toString()}`)

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Too many requests. Using cached articles instead.")
        }
        throw new Error("Failed to fetch articles")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch articles")
      }

      const newArticles = data.data as NewsArticle[]
      setDataSource(data.source || "api")

      if (data.error) {
        setError(data.error)
      } else {
        setError(null)
      }

      setHasMore(newArticles.length > 0)

      if (reset) {
        setArticles(newArticles)
      } else {
        setArticles((prev) => [...prev, ...newArticles])
      }
    } catch (error: any) {
      console.error("Error fetching articles:", error)
      setError(error.message || "Failed to load articles")
      toast({
        title: "Error",
        description: error.message || "Failed to load articles. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (article: NewsArticle, voteType: "up" | "down") => {
    // Find article index
    const articleIndex = articles.findIndex((a) => a.id === article.id)
    if (articleIndex === -1) return

    // Determine new vote state
    const newVoteType = article.userVote === voteType ? null : voteType

    // Create updated article with optimistic update
    const updatedArticle = {
      ...article,
      userVote: newVoteType,
      votes: {
        upvotes:
          voteType === "up"
            ? newVoteType
              ? article.votes.upvotes + 1
              : article.votes.upvotes - 1
            : article.userVote === "up"
              ? article.votes.upvotes - 1
              : article.votes.upvotes,
        downvotes:
          voteType === "down"
            ? newVoteType
              ? article.votes.downvotes + 1
              : article.votes.downvotes - 1
            : article.userVote === "down"
              ? article.votes.downvotes - 1
              : article.votes.downvotes,
      },
    }

    // Update state optimistically
    const updatedArticles = [...articles]
    updatedArticles[articleIndex] = updatedArticle
    setArticles(updatedArticles)

    // If modal is open with this article, update it too
    if (selectedArticle && selectedArticle.id === article.id) {
      setSelectedArticle(updatedArticle)
    }

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
          voteType: newVoteType,
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
      fetchArticles(true)
    }
  }

  const handleBookmark = (articleId: string) => {
    toast({
      title: "Article Bookmarked",
      description: "This article has been saved to your reading list.",
    })
  }

  const openArticleDetail = (article: NewsArticle) => {
    setSelectedArticle(article)
    setModalOpen(true)
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

  const getPoliticalLabel = (score: number) => {
    return score.toFixed(1)
  }

  const renderArticleCard = (article: NewsArticle, index: number) => {
    const isLastArticle = index === articles.length - 1

    return (
      <Card
        key={article.id}
        className="hover:shadow-md transition-shadow"
        ref={isLastArticle ? lastArticleRef : undefined}
      >
        <CardHeader className="cursor-pointer" onClick={() => openArticleDetail(article)}>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{article.title}</CardTitle>
            {article.political_score !== undefined && (
              <Badge variant="outline" className={getPoliticalScoreColor(article.political_score)}>
                {getPoliticalLabel(article.political_score)}
              </Badge>
            )}
          </div>
          <CardDescription className="flex items-center gap-2">
            <span>{article.source}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(article.published_at).toLocaleString()}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 cursor-pointer" onClick={() => openArticleDetail(article)}>
          {article.image_url && (
            <div className="overflow-hidden rounded-lg">
              <img
                src={article.image_url || "/placeholder.svg"}
                alt={article.title}
                className="h-48 w-full object-cover transition-transform hover:scale-105"
              />
            </div>
          )}
          <p>{article.description}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={article.userVote === "up" ? "default" : "ghost"}
                className="h-8 px-2"
                onClick={() => handleVote(article, "up")}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{article.votes.upvotes}</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={article.userVote === "down" ? "default" : "ghost"}
                className="h-8 px-2"
                onClick={() => handleVote(article, "down")}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{article.votes.downvotes}</span>
            </div>

            <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => handleBookmark(article.id)}>
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>

          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openArticleDetail(article)}>
            <span>Read More</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <NewsSearch onSearch={handleSearch} />

      {error && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Limit Reached</AlertTitle>
          <AlertDescription>
            {error}
            {dataSource === "cache_fallback" && <p className="mt-1">Showing cached articles instead.</p>}
          </AlertDescription>
        </Alert>
      )}

      {articles.length === 0 && !loading ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No articles found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria</p>
        </div>
      ) : (
        articles.map((article, index) => renderArticleCard(article, index))
      )}

      {loading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <ArticleDetailModal article={selectedArticle} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}

