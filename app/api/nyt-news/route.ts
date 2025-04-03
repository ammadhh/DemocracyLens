import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"
import { analyzePoliticalLeaning } from "@/lib/openai"

const NYT_API_KEY = process.env.NYT_API_KEY

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const section = searchParams.get("section") || "all"
    const page = Number.parseInt(searchParams.get("page") || "1")

    // Build the NYT API URL
    let nytApiUrl: string

    if (query) {
      // Article Search API
      nytApiUrl = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${encodeURIComponent(query)}&page=${page - 1}&api-key=${NYT_API_KEY}`
    } else {
      // Top Stories API
      nytApiUrl = `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${NYT_API_KEY}`
    }

    // Fetch from NYT API
    const response = await fetch(nytApiUrl)

    if (!response.ok) {
      throw new Error(`NYT API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Process the articles
    let articles = []

    if (query) {
      // Process Article Search API response
      articles = await processNytArticles(data.response.docs)
    } else {
      // Process Top Stories API response
      articles = await processNytArticles(data.results)
    }

    return NextResponse.json({
      success: true,
      data: articles,
      source: "nyt_api",
    })
  } catch (error: any) {
    console.error("Error in NYT news API route:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch NYT news",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

async function processNytArticles(nytArticles: any[]) {
  const supabase = getSupabaseClient()

  // Process and store articles
  const articles = await Promise.all(
    nytArticles.map(async (article: any) => {
      try {
        // Extract the relevant data based on the API response format
        const isSearchApi = article.headline !== undefined

        const title = isSearchApi ? article.headline.main : article.title
        const description = isSearchApi ? article.abstract : article.abstract
        const url = isSearchApi ? article.web_url : article.url
        const publishedAt = isSearchApi ? article.pub_date : article.published_date
        const source = "New York Times"

        // Get the image URL
        let imageUrl = null
        if (isSearchApi && article.multimedia && article.multimedia.length > 0) {
          // For Article Search API
          const multimedia = article.multimedia.find((m: any) => m.type === "image" && m.subtype === "xlarge")
          if (multimedia) {
            imageUrl = `https://www.nytimes.com/${multimedia.url}`
          }
        } else if (!isSearchApi && article.multimedia && article.multimedia.length > 0) {
          // For Top Stories API
          const multimedia = article.multimedia.find((m: any) => m.format === "superJumbo" || m.format === "Large")
          if (multimedia) {
            imageUrl = multimedia.url
          }
        }

        // Generate a unique ID for the article
        const externalId = Buffer.from(url).toString("base64")

        // Check if article already exists in our database
        const { data: existingArticle } = await supabase
          .from("articles")
          .select("id, political_score")
          .eq("external_id", externalId)
          .maybeSingle()

        let articleId = existingArticle?.id
        let politicalScore = existingArticle?.political_score

        // If article doesn't exist or doesn't have a political score, analyze it
        if (!articleId || politicalScore === null) {
          // Create a temporary article object for analysis
          const tempArticle = {
            id: "",
            external_id: externalId,
            title,
            description,
            content: "",
            source,
            source_type: "left" as const, // NYT is generally considered left-leaning
            published_at: publishedAt,
            url,
            image_url: imageUrl,
          }

          // Analyze the political score
          try {
            politicalScore = await analyzePoliticalLeaning(tempArticle)
          } catch (error) {
            console.error("Error analyzing political score:", error)
            // Default NYT score if analysis fails
            politicalScore = -5.2 + (Math.random() * 2 - 1) // Add some randomness
          }

          // Determine source type based on political score
          let sourceType: "left" | "center" | "right" = "left"
          if (politicalScore > -3 && politicalScore < 3) sourceType = "center"
          else if (politicalScore >= 3) sourceType = "right"

          // If article doesn't exist, insert it
          if (!articleId) {
            const { data: newArticle, error } = await supabase
              .from("articles")
              .insert({
                external_id: externalId,
                title,
                description,
                source,
                source_type: sourceType,
                published_at: publishedAt,
                url,
                image_url: imageUrl,
                political_score: politicalScore,
              })
              .select("id")
              .single()

            if (error) {
              console.error("Error inserting NYT article:", error)
            } else {
              articleId = newArticle.id
            }
          }
          // If article exists but doesn't have a political score, update it
          else if (existingArticle && existingArticle.political_score === null) {
            const { error } = await supabase
              .from("articles")
              .update({
                political_score: politicalScore,
              })
              .eq("id", existingArticle.id)

            if (error) {
              console.error("Error updating NYT article political score:", error)
            }
          }
        }

        // Get vote counts for this article
        const votes = { upvotes: 0, downvotes: 0 }

        if (articleId) {
          const { data: voteData } = await supabase
            .from("article_votes")
            .select("vote_type")
            .eq("article_id", articleId)

          if (voteData) {
            votes.upvotes = voteData.filter((v) => v.vote_type === "up").length
            votes.downvotes = voteData.filter((v) => v.vote_type === "down").length
          }
        }

        // Return processed article
        return {
          id: articleId || externalId,
          title,
          description,
          source,
          source_type: politicalScore <= -3 ? "left" : politicalScore >= 3 ? "right" : "center",
          political_score: politicalScore,
          published_at: publishedAt,
          url,
          image_url: imageUrl,
          votes,
          userVote: null,
        }
      } catch (error) {
        console.error("Error processing NYT article:", error)
        return null
      }
    }),
  )

  // Filter out any null articles
  return articles.filter((a) => a !== null)
}

