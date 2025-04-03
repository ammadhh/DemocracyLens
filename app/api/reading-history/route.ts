import { NextResponse } from "next/server"
import {
  trackArticleRead,
  getUserReadingHistory,
  clearUserReadingHistory,
  getArticleById,
  updateArticleLocation,
} from "@/lib/supabase"
import { extractArticleLocation } from "@/lib/openai"

export async function POST(request: Request) {
  try {
    const { articleId, guestId } = await request.json()

    if (!articleId || !guestId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await trackArticleRead(articleId, guestId)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to track article read",
        },
        { status: 500 },
      )
    }

    // Get the article to check if it already has location data
    const article = await getArticleById(articleId)

    if (article && (!article.location_lat || !article.location_lng)) {
      // Extract location data using OpenAI (don't await to make the response faster)
      extractArticleLocation(article)
        .then(async (locationData) => {
          if (locationData.coordinates) {
            // Update the article with location data
            await updateArticleLocation(article.id, {
              location_name: locationData.location,
              location_lat: locationData.coordinates.lat,
              location_lng: locationData.coordinates.lng,
            })
          }
        })
        .catch((error) => {
          console.error("Error extracting article location:", error)
        })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("Error tracking article read:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to track article read",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get("guestId")
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10)
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10)
    const withLocation = searchParams.get("withLocation") === "true"

    if (!guestId) {
      return NextResponse.json({ error: "Missing guestId parameter" }, { status: 400 })
    }

    const history = await getUserReadingHistory(guestId, limit, offset)

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error: any) {
    console.error("Error fetching reading history:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch reading history",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get("guestId")

    if (!guestId) {
      return NextResponse.json({ error: "Missing guestId parameter" }, { status: 400 })
    }

    const success = await clearUserReadingHistory(guestId)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to clear reading history",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("Error clearing reading history:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to clear reading history",
      },
      { status: 500 },
    )
  }
}

