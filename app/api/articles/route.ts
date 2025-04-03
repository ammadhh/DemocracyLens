import { NextResponse } from "next/server"
import { getArticles, getArticleById } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      // Get a specific article
      const article = await getArticleById(id)

      if (!article) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: article })
    } else {
      // Get all articles
      const articles = await getArticles()
      return NextResponse.json({ success: true, data: articles })
    }
  } catch (error) {
    console.error("Error fetching articles:", error)
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 })
  }
}

