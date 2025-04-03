"use client"

import { useState, useEffect } from "react"
import type { Comment } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentItem } from "@/components/comment-item"
import { getGuestId } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MessageSquare, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface CommentsSectionProps {
  articleId: string
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentGuestId, setCurrentGuestId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    async function initialize() {
      try {
        const guestId = await getGuestId()
        setCurrentGuestId(guestId)
        fetchComments()
      } catch (error) {
        console.error("Error initializing comments:", error)
      }
    }

    initialize()
  }, [articleId])

  const fetchComments = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/comments?articleId=${articleId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch comments")
      }

      const data = await response.json()

      if (data.success) {
        setComments(data.data)
      } else {
        throw new Error(data.error || "Failed to fetch comments")
      }
    } catch (error: any) {
      console.error("Error fetching comments:", error)
      setError(error.message || "Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (newComment.trim() === "") return

    setSubmitting(true)
    setError(null)

    try {
      const guestId = await getGuestId()

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          guestId,
          content: newComment,
          parentId: replyToId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit comment")
      }

      const data = await response.json()

      if (data.success) {
        setNewComment("")
        setReplyToId(null)
        fetchComments()
        toast({
          title: "Comment submitted",
          description: "Your comment has been submitted and is being analyzed.",
        })
      } else {
        throw new Error(data.error || "Failed to submit comment")
      }
    } catch (error: any) {
      console.error("Error submitting comment:", error)
      setError(error.message || "Failed to submit comment")
      toast({
        title: "Error",
        description: "Failed to submit comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateComment = async (commentId: string, content: string): Promise<boolean> => {
    try {
      const guestId = await getGuestId()

      const response = await fetch("/api/comments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId,
          guestId,
          content,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update comment")
      }

      const data = await response.json()

      if (data.success) {
        fetchComments()
        return true
      } else {
        throw new Error(data.error || "Failed to update comment")
      }
    } catch (error: any) {
      console.error("Error updating comment:", error)
      throw error
    }
  }

  const handleDeleteComment = async (commentId: string): Promise<boolean> => {
    try {
      const guestId = await getGuestId()

      const response = await fetch(`/api/comments?commentId=${commentId}&guestId=${guestId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete comment")
      }

      const data = await response.json()

      if (data.success) {
        fetchComments()
        return true
      } else {
        throw new Error(data.error || "Failed to delete comment")
      }
    } catch (error: any) {
      console.error("Error deleting comment:", error)
      throw error
    }
  }

  const handleReply = (parentId: string) => {
    setReplyToId(parentId)
  }

  const filteredComments = comments.filter((comment) => {
    if (activeTab === "all") return true
    if (activeTab === "liberal") return comment.political_score !== undefined && comment.political_score < -3
    if (activeTab === "neutral")
      return comment.political_score !== undefined && comment.political_score >= -3 && comment.political_score <= 3
    if (activeTab === "conservative") return comment.political_score !== undefined && comment.political_score > 3
    return true
  })

  return (
    <div className="space-y-4">
      {/* Comment Input Box - Moved to top for better visibility */}
      <div className="flex items-center gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 min-h-[60px] resize-none"
        />
        <Button onClick={handleSubmitComment} disabled={submitting || newComment.trim() === ""} className="h-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </Button>
      </div>

      {replyToId && (
        <div className="flex items-center justify-between rounded-md bg-muted p-2 text-xs">
          <span>Replying to a comment</span>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setReplyToId(null)}>
            Cancel Reply
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="liberal">Liberal</TabsTrigger>
          <TabsTrigger value="neutral">Neutral</TabsTrigger>
          <TabsTrigger value="conservative">Conservative</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Comments List */}
      <div className="mt-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No comments yet</p>
            <p className="text-sm text-muted-foreground">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentGuestId={currentGuestId}
                onReply={handleReply}
                onUpdate={handleUpdateComment}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

