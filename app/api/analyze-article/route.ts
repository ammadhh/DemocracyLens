import { NextResponse } from "next/server"
import { getArticleById, getArticleByExternalId, updateArticle } from "@/lib/supabase"
import { generateArticleSummary, analyzePoliticalLeaning } from "@/lib/openai"

export async function POST(request: Request) {
  try {
    const { articleId } = await request.json()

    if (!articleId) {
      return NextResponse.json({ error: "Missing articleId" }, { status: 400 })
    }

    // Try to get the article by ID first
    let article = await getArticleById(articleId)

    // If not found by ID, try by external_id
    if (!article) {
      article = await getArticleByExternalId(articleId)
    }

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Always generate a fresh analysis for each request to ensure uniqueness
    // This is for demo purposes - in production, you might want to cache results
    console.log(`Generating fresh analysis for article: ${article.id}`)
    const [summary, politicalScore] = await Promise.all([
      generateArticleSummary(article),
      analyzePoliticalLeaning(article),
    ])

    console.log(`Generated political score: ${politicalScore}`)

    // Update the article with the new data
    await updateArticle(article.id, {
      ai_summary: summary,
      political_score: politicalScore,
    })

    return NextResponse.json({
      success: true,
      data: {
        summary,
        politicalScore,
      },
    })
  } catch (error: any) {
    console.error("Error analyzing article:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze article",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

