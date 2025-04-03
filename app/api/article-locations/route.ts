import { NextResponse } from "next/server"
import { getArticlesWithLocation, getUserReadArticlesWithLocation } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get("guestId")
    const userOnly = searchParams.get("userOnly") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10)

    // If userOnly is true, we need a guestId
    if (userOnly && !guestId) {
      return NextResponse.json({ error: "Missing guestId parameter for userOnly query" }, { status: 400 })
    }

    let articles = []

    if (userOnly && guestId) {
      // Get only articles read by this user
      const readArticles = await getUserReadArticlesWithLocation(guestId, limit)
      articles = readArticles
        .filter((item) => item && item.article) // Filter out any null items
        .map((item) => ({
          id: item.article.id,
          title: item.article.title || "Untitled Article",
          description: item.article.description || "",
          source: item.article.source || "Unknown Source",
          source_type: item.article.source_type || "center",
          political_score: item.article.political_score || 0,
          published_at: item.article.published_at || new Date().toISOString(),
          url: item.article.url || "#",
          location: item.article.location_name || "Unknown Location",
          lat: item.article.location_lat || 0,
          lng: item.article.location_lng || 0,
          read_at: item.read_at || new Date().toISOString(),
        }))
    } else {
      // Get all articles with location data
      const allArticles = await getArticlesWithLocation(limit)
      articles = allArticles
        .filter((article) => article) // Filter out any null articles
        .map((article) => ({
          id: article.id,
          title: article.title || "Untitled Article",
          description: article.description || "",
          source: article.source || "Unknown Source",
          source_type: article.source_type || "center",
          political_score: article.political_score || 0,
          published_at: article.published_at || new Date().toISOString(),
          url: article.url || "#",
          location: article.location_name || "Unknown Location",
          lat: article.location_lat || 0,
          lng: article.location_lng || 0,
        }))
    }

    // Filter out articles without valid coordinates
    articles = articles.filter(
      (article) =>
        typeof article.lat === "number" &&
        typeof article.lng === "number" &&
        !isNaN(article.lat) &&
        !isNaN(article.lng),
    )

    return NextResponse.json({
      success: true,
      data: articles,
    })
  } catch (error: any) {
    console.error("Error fetching article locations:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch article locations",
      },
      { status: 500 },
    )
  }
}

