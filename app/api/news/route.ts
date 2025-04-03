import { NextResponse } from "next/server"
import { getSupabaseClient, searchCachedArticles, getArticleByExternalId, createArticle } from "@/lib/supabase"

// Function to determine political score based on source and content
const analyzePoliticalScore = (source: string, title: string, description: string): number => {
  // This is a simplified mock implementation
  // In a real app, you would use OpenAI or another NLP service to analyze the content

  // Some mock sources with predefined leanings
  const sourceBias: Record<string, number> = {
    CNN: -6.5,
    MSNBC: -7.8,
    "New York Times": -5.2,
    "Washington Post": -4.8,
    NPR: -3.5,
    BBC: -1.2,
    Reuters: 0.3,
    "Associated Press": 0.1,
    "Wall Street Journal": 3.8,
    "Fox News": 7.2,
    Breitbart: 8.5,
    "Daily Wire": 7.9,
  }

  // Start with source bias if known
  let score = sourceBias[source] || 0

  // Adjust based on keywords in title and description
  const text = (title + " " + description).toLowerCase()

  // Liberal-leaning keywords
  const liberalKeywords = ["progressive", "equity", "climate change", "social justice", "diversity", "inclusion"]
  liberalKeywords.forEach((keyword) => {
    if (text.includes(keyword.toLowerCase())) {
      score -= 0.5
    }
  })

  // Conservative-leaning keywords
  const conservativeKeywords = ["traditional", "freedom", "liberty", "tax cuts", "small government", "family values"]
  conservativeKeywords.forEach((keyword) => {
    if (text.includes(keyword.toLowerCase())) {
      score += 0.5
    }
  })

  // Clamp the score between -10 and 10
  return Math.max(-10, Math.min(10, score))
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const fromDate = searchParams.get("from") || ""
    const sortBy = searchParams.get("sortBy") || "publishedAt"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = 10
    const offset = (page - 1) * pageSize

    // First, try to get cached articles from our database
    const cachedArticles = await searchCachedArticles(query, fromDate, sortBy, pageSize, offset)

    // If we have enough cached articles, return them
    if (cachedArticles.length >= pageSize / 2) {
      // Get vote counts for these articles
      const supabase = getSupabaseClient()
      const articlesWithVotes = await Promise.all(
        cachedArticles.map(async (article) => {
          // Get vote counts
          const { data: voteData } = await supabase
            .from("article_votes")
            .select("vote_type")
            .eq("article_id", article.id)

          const votes = {
            upvotes: voteData?.filter((v) => v.vote_type === "up").length || 0,
            downvotes: voteData?.filter((v) => v.vote_type === "down").length || 0,
          }

          return {
            ...article,
            political_score:
              article.political_score || analyzePoliticalScore(article.source, article.title, article.description),
            votes,
            userVote: null,
          }
        }),
      )

      return NextResponse.json({
        success: true,
        data: articlesWithVotes,
        source: "cache",
      })
    }

    // If not enough cached articles, try to fetch from NewsAPI
    try {
      // Build the NewsAPI URL
      let newsApiUrl = "https://newsapi.org/v2/everything?"
      const params = new URLSearchParams()

      if (query) {
        params.append("q", query)
      } else {
        // Default query if none provided
        params.append("q", "politics OR democracy OR government")
      }

      if (fromDate) {
        params.append("from", fromDate)
      }

      params.append("sortBy", sortBy)
      params.append("pageSize", pageSize.toString())
      params.append("page", page.toString())
      params.append("language", "en")
      params.append("apiKey", process.env.NEWS_API_KEY || "")

      newsApiUrl += params.toString()

      // Fetch from NewsAPI
      const response = await fetch(newsApiUrl)

      // Check if we hit the rate limit
      if (response.status === 429) {
        throw new Error("Too Many Requests")
      }

      const data = await response.json()

      if (data.status !== "ok") {
        throw new Error(data.message || "Failed to fetch from NewsAPI")
      }

      const supabase = getSupabaseClient()

      // Process and store articles
      const articles = await Promise.all(
        data.articles.map(async (article: any) => {
          try {
            // Generate a unique ID for the article
            const externalId = Buffer.from(article.url).toString("base64")

            // Analyze political score
            const politicalScore = analyzePoliticalScore(article.source.name, article.title, article.description)

            // Determine source type based on political score
            let sourceType: "left" | "center" | "right" = "center"
            if (politicalScore <= -3) sourceType = "left"
            else if (politicalScore >= 3) sourceType = "right"

            // Check if article already exists in our database
            let existingArticle = await getArticleByExternalId(externalId)

            // If article doesn't exist, insert it
            if (!existingArticle) {
              existingArticle = await createArticle({
                external_id: externalId,
                title: article.title,
                description: article.description,
                content: article.content,
                source: article.source.name,
                source_type: sourceType,
                published_at: article.publishedAt,
                url: article.url,
                image_url: article.urlToImage,
                political_score: politicalScore,
              })
            }

            // Get vote counts for this article
            const votes = { upvotes: 0, downvotes: 0 }

            if (existingArticle) {
              const { data: voteData } = await supabase
                .from("article_votes")
                .select("vote_type")
                .eq("article_id", existingArticle.id)

              if (voteData) {
                votes.upvotes = voteData.filter((v) => v.vote_type === "up").length
                votes.downvotes = voteData.filter((v) => v.vote_type === "down").length
              }
            }

            // Return processed article
            return {
              ...existingArticle,
              political_score: existingArticle?.political_score || politicalScore,
              votes,
              userVote: null,
            }
          } catch (error) {
            console.error("Error processing article:", error)
            return null
          }
        }),
      )

      // Filter out any null articles
      const validArticles = articles.filter((a) => a !== null)

      return NextResponse.json({
        success: true,
        data: validArticles,
        totalResults: data.totalResults,
        source: "api",
      })
    } catch (error: any) {
      // If we hit the rate limit or any other error, fall back to cached articles
      console.error("Error fetching from NewsAPI:", error)

      // Try to get more cached articles as a fallback
      const fallbackArticles = await searchCachedArticles(
        query,
        fromDate,
        sortBy,
        pageSize * 2, // Get more articles to ensure we have enough
        offset,
      )

      // Get vote counts for these articles
      const supabase = getSupabaseClient()
      const articlesWithVotes = await Promise.all(
        fallbackArticles.map(async (article) => {
          // Get vote counts
          const { data: voteData } = await supabase
            .from("article_votes")
            .select("vote_type")
            .eq("article_id", article.id)

          const votes = {
            upvotes: voteData?.filter((v) => v.vote_type === "up").length || 0,
            downvotes: voteData?.filter((v) => v.vote_type === "down").length || 0,
          }

          return {
            ...article,
            political_score:
              article.political_score || analyzePoliticalScore(article.source, article.title, article.description),
            votes,
            userVote: null,
          }
        }),
      )

      return NextResponse.json({
        success: true,
        data: articlesWithVotes,
        error: error.message,
        source: "cache_fallback",
      })
    }
  } catch (error: any) {
    console.error("Error in news API route:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch news",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

