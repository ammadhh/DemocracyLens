import { NextResponse } from "next/server"
import { getUserVote } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get("articleId")
    const guestId = searchParams.get("guestId")

    if (!articleId || !guestId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const voteType = await getUserVote(articleId, guestId)

    return NextResponse.json({
      success: true,
      data: {
        voteType,
      },
    })
  } catch (error) {
    console.error("Error checking user vote:", error)
    return NextResponse.json({ error: "Failed to check user vote" }, { status: 500 })
  }
}

