import { NextResponse } from "next/server"
import { getCommentsByArticleId, createComment, updateComment, deleteComment } from "@/lib/supabase"
import { analyzeCommentPoliticalLeaning } from "@/lib/openai"

// GET comments for an article
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get("articleId")

    if (!articleId) {
      return NextResponse.json({ error: "Missing articleId parameter" }, { status: 400 })
    }

    const comments = await getCommentsByArticleId(articleId)

    return NextResponse.json({
      success: true,
      data: comments,
    })
  } catch (error: any) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch comments",
      },
      { status: 500 },
    )
  }
}

// POST a new comment
export async function POST(request: Request) {
  try {
    const { articleId, guestId, content, parentId } = await request.json()

    if (!articleId || !guestId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create the comment
    const comment = await createComment(articleId, guestId, content, parentId)

    if (!comment) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create comment",
        },
        { status: 500 },
      )
    }

    // Analyze the comment with OpenAI (don't await this to make the response faster)
    analyzeCommentPoliticalLeaning(content)
      .then(async ({ summary, politicalScore }) => {
        // Update the comment with the analysis
        await updateComment(comment.id, guestId, {
          ai_summary: summary,
          political_score: politicalScore,
        })
      })
      .catch((error) => {
        console.error("Error analyzing comment:", error)
      })

    return NextResponse.json({
      success: true,
      data: comment,
    })
  } catch (error: any) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create comment",
      },
      { status: 500 },
    )
  }
}

// PUT to update a comment
export async function PUT(request: Request) {
  try {
    const { commentId, guestId, content } = await request.json()

    if (!commentId || !guestId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await updateComment(commentId, guestId, { content })

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update comment",
        },
        { status: 500 },
      )
    }

    // Re-analyze the comment with OpenAI
    analyzeCommentPoliticalLeaning(content)
      .then(async ({ summary, politicalScore }) => {
        // Update the comment with the new analysis
        await updateComment(commentId, guestId, {
          ai_summary: summary,
          political_score: politicalScore,
        })
      })
      .catch((error) => {
        console.error("Error analyzing updated comment:", error)
      })

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("Error updating comment:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update comment",
      },
      { status: 500 },
    )
  }
}

// DELETE a comment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("commentId")
    const guestId = searchParams.get("guestId")

    if (!commentId || !guestId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const success = await deleteComment(commentId, guestId)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete comment",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("Error deleting comment:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete comment",
      },
      { status: 500 },
    )
  }
}

// PATCH to analyze a comment
export async function PATCH(request: Request) {
  try {
    const { commentId, guestId, content } = await request.json()

    if (!commentId || !guestId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Analyze the comment with OpenAI
    const { summary, politicalScore } = await analyzeCommentPoliticalLeaning(content)

    // Update the comment with the analysis
    const success = await updateComment(commentId, guestId, {
      ai_summary: summary,
      political_score: politicalScore,
    })

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update comment with analysis",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        politicalScore,
      },
    })
  } catch (error: any) {
    console.error("Error analyzing comment:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze comment",
      },
      { status: 500 },
    )
  }
}

