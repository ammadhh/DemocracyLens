"use client"

import { useState } from "react"
import type { Comment } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, ThumbsUp, ThumbsDown, MoreHorizontal, Edit, Trash2, AlertCircle, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CommentItemProps {
  comment: Comment
  currentGuestId: string
  onReply: (parentId: string) => void
  onUpdate: (commentId: string, content: string) => Promise<boolean>
  onDelete: (commentId: string) => Promise<boolean>
  isReply?: boolean
}

export function CommentItem({
  comment,
  currentGuestId,
  onReply,
  onUpdate,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isReplying, setIsReplying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const isOwner = comment.user?.guest_id === currentGuestId

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async () => {
    if (editContent.trim() === "") return

    setIsUpdating(true)
    setError(null)

    try {
      const success = await onUpdate(comment.id, editContent)

      if (success) {
        setIsEditing(false)
        toast({
          title: "Comment updated",
          description: "Your comment has been updated successfully.",
        })
      } else {
        throw new Error("Failed to update comment")
      }
    } catch (error: any) {
      console.error("Error updating comment:", error)
      setError(error.message || "Failed to update comment")
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const success = await onDelete(comment.id)

      if (success) {
        toast({
          title: "Comment deleted",
          description: "Your comment has been deleted successfully.",
        })
      } else {
        throw new Error("Failed to delete comment")
      }
    } catch (error: any) {
      console.error("Error deleting comment:", error)
      setError(error.message || "Failed to delete comment")
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReply = () => {
    setIsReplying(!isReplying)
    if (!isReplying) {
      onReply(comment.id)
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

  // Generate initials from guest ID
  const getInitials = (guestId: string) => {
    if (!guestId) return "U"
    return guestId.substring(6, 8).toUpperCase()
  }

  return (
    <div
      className={`${isReply ? "ml-8 mt-2" : "mt-4"} border-l-2 pl-4 ${
        comment.political_score !== undefined && comment.political_score !== null
          ? comment.political_score <= -3
            ? "border-blue-300"
            : comment.political_score >= 3
              ? "border-red-300"
              : "border-purple-300"
          : "border-gray-200"
      }`}
    >
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {getInitials(comment.user?.guest_id || "")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">User {comment.user?.guest_id?.substring(6, 14) || "Anonymous"}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.created_at), "MMM d, yyyy h:mm a")}
            </span>
            {comment.political_score !== undefined && comment.political_score !== null && (
              <Badge variant="outline" className={getPoliticalScoreColor(comment.political_score)}>
                {comment.political_score.toFixed(1)}
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px]"
                placeholder="Edit your comment..."
              />

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={isUpdating || editContent.trim() === ""}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm">{comment.content}</p>

              {comment.ai_summary && (
                <div className="rounded-md bg-muted p-2 text-xs">
                  <p className="font-medium">AI Summary:</p>
                  <p className="text-muted-foreground">{comment.ai_summary}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleReply}>
                  <MessageSquare className="mr-1 h-3 w-3" />
                  Reply
                </Button>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>

                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentGuestId={currentGuestId}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

