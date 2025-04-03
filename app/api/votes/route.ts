import { NextResponse } from "next/server"
import { getArticleVotes, voteOnArticle } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get("articleId")

    if (!articleId) {
      return NextResponse.json({ error: "Missing articleId parameter" }, { status: 400 })
    }

    const votes = await getArticleVotes(articleId)

    return NextResponse.json({
      success: true,
      data: votes,
    })
  } catch (error: any) {
    console.error("Error fetching votes:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch votes",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { articleId, guestId, voteType } = await request.json()

    if (!articleId || !guestId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await voteOnArticle(articleId, guestId, voteType)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to record vote",
        },
        { status: 500 },
      )
    }

    // Get updated vote counts
    const votes = await getArticleVotes(articleId)

    return NextResponse.json({
      success: true,
      data: {
        votes,
        userVote: voteType,
      },
    })
  } catch (error: any) {
    console.error("Error recording vote:", error)

    // Check if it's a rate limit error
    if (error.message && error.message.includes("Too Many Requests")) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
        },
        { status: 429 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to record vote",
      },
      { status: 500 },
    )
  }
}

