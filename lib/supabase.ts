import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

// Add this at the top of the file, right after the imports
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://democracylensammad.vercel.app"

// Types for our database tables
export type Article = {
  id: string
  external_id: string
  title: string
  description: string
  content?: string
  source: string
  source_type: "left" | "center" | "right"
  published_at: string
  url: string
  image_url?: string
  created_at?: string
  ai_summary?: string
  political_score?: number
  // New location fields
  location_name?: string
  location_lat?: number
  location_lng?: number
}

export type ArticleVote = {
  id: string
  article_id: string
  user_id: string
  vote_type: "up" | "down"
  created_at?: string
  updated_at?: string
}

export type GuestUser = {
  id: string
  guest_id: string
  created_at?: string
  last_active_at?: string
}

export type VoteCounts = {
  upvotes: number
  downvotes: number
}

export type ReadingHistoryItem = {
  id: string
  user_id: string
  article_id: string
  read_at: string
  article?: Article
}

export type Comment = {
  id: string
  article_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  ai_summary?: string
  political_score?: number
  parent_id?: string
  is_deleted: boolean
  user?: {
    guest_id: string
  }
  replies?: Comment[]
}

// Create a singleton Supabase client
let supabaseInstance: ReturnType<typeof supabaseCreateClient> | null = null

// Then update the getSupabaseClient function
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = supabaseCreateClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          redirectTo: SITE_URL,
        },
      },
    )
  }
  return supabaseInstance
}

// For backward compatibility
export const supabase = getSupabaseClient()

// Function to get or create a guest user ID
export const getGuestId = async (): Promise<string> => {
  let guestId = localStorage.getItem("democracy_lens_guest_id")

  if (!guestId) {
    guestId = "guest_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    localStorage.setItem("democracy_lens_guest_id", guestId)

    try {
      // Register the guest user in the database
      await registerGuestUser(guestId)
    } catch (error) {
      console.error("Error registering guest user:", error)
      // Continue even if registration fails
    }
  } else {
    try {
      // Update last active timestamp
      await updateGuestUserActivity(guestId)
    } catch (error) {
      console.error("Error updating guest activity:", error)
      // Continue even if update fails
    }
  }

  return guestId
}

// Register a new guest user
export const registerGuestUser = async (guestId: string): Promise<GuestUser | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("guest_users").insert({ guest_id: guestId }).select().single()

    if (error) {
      console.error("Error registering guest user:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error registering guest user:", error)
    return null
  }
}

// Update guest user's last active timestamp
export const updateGuestUserActivity = async (guestId: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from("guest_users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("guest_id", guestId)

    if (error) {
      console.error("Error updating guest user activity:", error)
    }
  } catch (error) {
    console.error("Unexpected error updating guest activity:", error)
  }
}

// Get guest user by guest_id
export const getGuestUserByGuestId = async (guestId: string): Promise<GuestUser | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("guest_users").select("*").eq("guest_id", guestId).single()

    if (error) {
      console.error("Error fetching guest user:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching guest user:", error)
    return null
  }
}

// Article CRUD operations
export const getArticles = async (limit = 10, offset = 0): Promise<Article[]> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching articles:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching articles:", error)
    return []
  }
}

export const getArticleById = async (id: string): Promise<Article | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("articles").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching article:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching article:", error)
    return null
  }
}

// Change the getArticleByExternalId function to handle multiple or no rows
export const getArticleByExternalId = async (externalId: string): Promise<Article | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("articles").select("*").eq("external_id", externalId).maybeSingle() // Use maybeSingle instead of single to handle no rows

    if (error) {
      console.error("Error fetching article by external ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching article by external ID:", error)
    return null
  }
}

export const createArticle = async (article: Omit<Article, "id" | "created_at">): Promise<Article | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("articles").insert(article).select().single()

    if (error) {
      console.error("Error creating article:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error creating article:", error)
    return null
  }
}

export const updateArticle = async (id: string, updates: Partial<Article>): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("articles").update(updates).eq("id", id)

    if (error) {
      console.error("Error updating article:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating article:", error)
    return false
  }
}

export const deleteArticle = async (id: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("articles").delete().eq("id", id)

    if (error) {
      console.error("Error deleting article:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error deleting article:", error)
    return false
  }
}

// Update article with location data
export const updateArticleLocation = async (
  articleId: string,
  locationData: {
    location_name: string
    location_lat?: number
    location_lng?: number
  },
): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from("articles")
      .update({
        location_name: locationData.location_name,
        location_lat: locationData.location_lat || null,
        location_lng: locationData.location_lng || null,
      })
      .eq("id", articleId)

    if (error) {
      console.error("Error updating article location:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating article location:", error)
    return false
  }
}

// Get articles with location data
export const getArticlesWithLocation = async (limit = 50): Promise<Article[]> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .not("location_lat", "is", null)
      .not("location_lng", "is", null)
      .order("published_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching articles with location:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching articles with location:", error)
    return []
  }
}

// Vote operations
export const getArticleVotes = async (articleId: string): Promise<VoteCounts> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("article_votes").select("vote_type").eq("article_id", articleId)

    if (error) {
      console.error("Error fetching article votes:", error)
      return { upvotes: 0, downvotes: 0 }
    }

    // Count votes manually
    const upvotes = data?.filter((vote) => vote.vote_type === "up").length || 0
    const downvotes = data?.filter((vote) => vote.vote_type === "down").length || 0

    return { upvotes, downvotes }
  } catch (error) {
    console.error("Unexpected error fetching article votes:", error)
    return { upvotes: 0, downvotes: 0 }
  }
}

export const getUserVote = async (articleId: string, guestId: string): Promise<"up" | "down" | null> => {
  try {
    // First get the user's UUID from the guest_id
    const user = await getGuestUserByGuestId(guestId)

    if (!user) {
      return null
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("article_votes")
      .select("vote_type")
      .eq("article_id", articleId)
      .eq("user_id", user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }
      console.error("Error fetching user vote:", error)
      return null
    }

    return data?.vote_type as "up" | "down" | null
  } catch (error) {
    console.error("Unexpected error fetching user vote:", error)
    return null
  }
}

export const voteOnArticle = async (
  articleId: string,
  guestId: string,
  voteType: "up" | "down" | null,
): Promise<boolean> => {
  try {
    // First get the user's UUID from the guest_id
    const user = await getGuestUserByGuestId(guestId)

    if (!user) {
      return false
    }

    try {
      const supabase = getSupabaseClient()
      // Check if the user already has a vote for this article
      const { data: existingVote, error: checkError } = await supabase
        .from("article_votes")
        .select("id, vote_type")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking existing vote:", checkError)
        return false
      }

      // Case 1: User wants to remove their vote
      if (voteType === null) {
        if (existingVote) {
          const { error: deleteError } = await supabase.from("article_votes").delete().eq("id", existingVote.id)

          if (deleteError) {
            console.error("Error removing vote:", deleteError)
            return false
          }
        }
        return true
      }

      // Case 2: User already has a vote and wants to change it
      if (existingVote) {
        const { error: updateError } = await supabase
          .from("article_votes")
          .update({
            vote_type: voteType,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingVote.id)

        if (updateError) {
          console.error("Error updating vote:", updateError)
          return false
        }
        return true
      }

      // Case 3: User doesn't have a vote and wants to add one
      const { error: insertError } = await supabase.from("article_votes").insert({
        article_id: articleId,
        user_id: user.id,
        vote_type: voteType,
      })

      if (insertError) {
        console.error("Error inserting vote:", insertError)
        return false
      }

      return true
    } catch (error) {
      console.error("Unexpected error in voteOnArticle:", error)
      return false
    }
  } catch (error) {
    console.error("Unexpected error in voteOnArticle:", error)
    return false
  }
}

// Function to get the current user ID (either authenticated or guest)
export const getCurrentUserId = async (): Promise<string> => {
  const supabase = getSupabaseClient()

  // First check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return user.id
  }

  // If not authenticated, use guest ID
  return getGuestId()
}

// Reading History operations
export const trackArticleRead = async (articleId: string, guestId: string): Promise<boolean> => {
  try {
    // Get the actual user UUID from the guest_id
    const user = await getGuestUserByGuestId(guestId)

    if (!user) {
      console.error("User not found for guest ID:", guestId)
      return false
    }

    const id = user.id // Use the actual UUID from the database

    const supabase = getSupabaseClient()

    // Check if this article is already in the user's reading history
    const { data: existingRecord, error: checkError } = await supabase
      .from("reading_history")
      .select("id")
      .eq("article_id", articleId)
      .eq("user_id", id)
      .maybeSingle()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking reading history:", checkError)
      return false
    }

    // If the article is already in the reading history, update the read_at timestamp
    if (existingRecord) {
      const { error: updateError } = await supabase
        .from("reading_history")
        .update({
          read_at: new Date().toISOString(),
        })
        .eq("id", existingRecord.id)

      if (updateError) {
        console.error("Error updating reading history:", updateError)
        return false
      }
      return true
    }

    // If the article is not in the reading history, add it
    const { error: insertError } = await supabase.from("reading_history").insert({
      article_id: articleId,
      user_id: id,
    })

    if (insertError) {
      console.error("Error inserting reading history:", insertError)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error tracking article read:", error)
    return false
  }
}

export const getUserReadingHistory = async (
  guestId: string,
  limit = 5,
  offset = 0,
): Promise<(ReadingHistoryItem & { article: Article })[]> => {
  try {
    // First get the user's UUID from the guest_id
    const user = await getGuestUserByGuestId(guestId)

    if (!user) {
      return []
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("reading_history")
      .select(`
      id,
      user_id,
      article_id,
      read_at,
      article:articles(*)
    `)
      .eq("user_id", user.id)
      .order("read_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching reading history:", error)
      return []
    }

    return (data as (ReadingHistoryItem & { article: Article })[]) || []
  } catch (error) {
    console.error("Unexpected error fetching reading history:", error)
    return []
  }
}

// Get articles read by a user with location data
export const getUserReadArticlesWithLocation = async (
  guestId: string,
  limit = 20,
): Promise<(ReadingHistoryItem & { article: Article })[]> => {
  try {
    // First get the user's UUID from the guest_id
    const user = await getGuestUserByGuestId(guestId)

    if (!user) {
      return []
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("reading_history")
      .select(`
        id,
        user_id,
        article_id,
        read_at,
        article:articles(*)
      `)
      .eq("user_id", user.id)
      .not("article.location_lat", "is", null)
      .not("article.location_lng", "is", null)
      .order("read_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching reading history with location:", error)
      return []
    }

    return (data as (ReadingHistoryItem & { article: Article })[]) || []
  } catch (error) {
    console.error("Unexpected error fetching reading history with location:", error)
    return []
  }
}

export const deleteReadingHistoryItem = async (historyId: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("reading_history").delete().eq("id", historyId)

    if (error) {
      console.error("Error deleting reading history item:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error deleting reading history item:", error)
    return false
  }
}

export const clearUserReadingHistory = async (guestId: string): Promise<boolean> => {
  try {
    // First get the user's UUID from the guest_id
    const user = await getGuestUserByGuestId(guestId)

    if (!user) {
      return false
    }

    const supabase = getSupabaseClient()
    const { error } = await supabase.from("reading_history").delete().eq("user_id", user.id)

    if (error) {
      console.error("Error clearing reading history:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error clearing reading history:", error)
    return false
  }
}

// Search cached articles
export const searchCachedArticles = async (
  query: string,
  fromDate?: string,
  sortBy = "published_at",
  limit = 10,
  offset = 0,
): Promise<Article[]> => {
  try {
    const supabase = getSupabaseClient()
    let queryBuilder = supabase.from("articles").select("*")

    // Add search conditions if query is provided
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Add date filter if provided
    if (fromDate) {
      queryBuilder = queryBuilder.gte("published_at", fromDate)
    }

    // Add sorting
    if (sortBy === "relevancy" && query) {
      // For relevancy sorting with a query, we'd ideally use full-text search
      // This is a simplified approach
      queryBuilder = queryBuilder.order("published_at", { ascending: false })
    } else if (sortBy === "popularity") {
      // For popularity, we could sort by vote count in a real implementation
      // This is a simplified approach
      queryBuilder = queryBuilder.order("published_at", { ascending: false })
    } else {
      // Default to date sorting
      queryBuilder = queryBuilder.order("published_at", { ascending: false })
    }

    // Add pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data, error } = await queryBuilder

    if (error) {
      console.error("Error searching cached articles:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error searching cached articles:", error)
    return []
  }
}

// Storage operations for files and images
export const uploadFile = async (bucket: string, path: string, file: File): Promise<string | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.error("Error uploading file:", error)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error("Unexpected error uploading file:", error)
    return null
  }
}

export const downloadFile = async (bucket: string, path: string): Promise<Blob | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) {
      console.error("Error downloading file:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error downloading file:", error)
    return null
  }
}

export const listFiles = async (bucket: string, path?: string): Promise<string[] | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage.from(bucket).list(path || "")

    if (error) {
      console.error("Error listing files:", error)
      return null
    }

    return data.map((file) => file.name)
  } catch (error) {
    console.error("Unexpected error listing files:", error)
    return null
  }
}

export const deleteFile = async (bucket: string, paths: string[]): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.storage.from(bucket).remove(paths)

    if (error) {
      console.error("Error deleting files:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error deleting files:", error)
    return false
  }
}

// User profile operations
export const getUserProfile = async (userId: string): Promise<any | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching user profile:", error)
    return null
  }
}

export const updateUserProfile = async (userId: string, updates: any): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    if (error) {
      console.error("Error updating user profile:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating user profile:", error)
    return false
  }
}

// Comment CRUD operations
export const getCommentsByArticleId = async (articleId: string): Promise<Comment[]> => {
  try {
    const supabase = getSupabaseClient()

    // Get top-level comments (no parent_id)
    const { data: topLevelComments, error: topLevelError } = await supabase
      .from("comments")
      .select(`
        *,
        user:guest_users(guest_id)
      `)
      .eq("article_id", articleId)
      .is("parent_id", null)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })

    if (topLevelError) {
      console.error("Error fetching top-level comments:", topLevelError)
      return []
    }

    // Get replies for each top-level comment
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const { data: replies, error: repliesError } = await supabase
          .from("comments")
          .select(`
            *,
            user:guest_users(guest_id)
          `)
          .eq("parent_id", comment.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true })

        if (repliesError) {
          console.error("Error fetching replies:", repliesError)
          return { ...comment, replies: [] }
        }

        return { ...comment, replies }
      }),
    )

    return commentsWithReplies
  } catch (error) {
    console.error("Unexpected error fetching comments:", error)
    return []
  }
}

export const createComment = async (
  articleId: string,
  guestId: string,
  content: string,
  parentId?: string,
): Promise<Comment | null> => {
  try {
    // First get the user's UUID from the guest_id
    const user = await getGuestUserByGuestId(guestId)

    if (!user) {
      return null
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("comments")
      .insert({
        article_id: articleId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error creating comment:", error)
    return null
  }
}

export const updateComment = async (
  commentId: string,
  guestId: string,
  updates: Partial<Comment>,
): Promise<boolean> => {
  try {
    // First get the user's UUID from the guest_id
    const user = await getGuestUserByGuestId(guestId)

    if (!user) {
      return false
    }

    const supabase = getSupabaseClient()

    // Verify the comment belongs to the user
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single()

    if (fetchError || !comment) {
      console.error("Error fetching comment:", fetchError)
      return false
    }

    if (comment.user_id !== user.id) {
      console.error("User does not own this comment")
      return false
    }

    // Update the comment
    const { error } = await supabase
      .from("comments")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)

    if (error) {
      console.error("Error updating comment:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating comment:", error)
    return false
  }
}

export const deleteComment = async (commentId: string, guestId: string): Promise<boolean> => {
  try {
    // First get the user's UUID from the guest_id
    const user = await getGuestUserByGuestId(guestId)

    if (!user) {
      return false
    }

    const supabase = getSupabaseClient()

    // Verify the comment belongs to the user
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single()

    if (fetchError || !comment) {
      console.error("Error fetching comment:", fetchError)
      return false
    }

    if (comment.user_id !== user.id) {
      console.error("User does not own this comment")
      return false
    }

    // Soft delete the comment
    const { error } = await supabase
      .from("comments")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)

    if (error) {
      console.error("Error deleting comment:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error deleting comment:", error)
    return false
  }
}

export const createClient = supabaseCreateClient

