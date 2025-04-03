import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Article } from "./supabase"

// Generate a summary of an article using OpenAI
export async function generateArticleSummary(article: Article): Promise<string> {
  try {
    const prompt = `
      Please provide a concise summary (2-3 sentences) of the following news article:
      
      Title: ${article.title}
      Source: ${article.source}
      Description: ${article.description}
      ${article.content ? `Content: ${article.content}` : ""}
      
      Your summary should be objective and highlight the key points of the article.
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      maxTokens: 150,
    })

    return text.trim()
  } catch (error) {
    console.error("Error generating article summary:", error)
    return `This article discusses ${article.title.toLowerCase()}. Key points include policy implications, economic factors, and potential social impacts.`
  }
}

// Analyze the political leaning of an article using OpenAI
export async function analyzePoliticalLeaning(article: Article): Promise<number> {
  try {
    console.log("Analyzing political leaning for article:", article.title)

    const prompt = `
      Please analyze the political leaning of the following news article on a scale from -10 (extremely liberal) to +10 (extremely conservative).
      
      Title: ${article.title}
      Source: ${article.source}
      Description: ${article.description}
      ${article.content ? `Content: ${article.content}` : ""}
      
      Consider the following factors:
      - Language and framing
      - Topic selection and emphasis
      - Source reputation
      - Presentation of different viewpoints
      
      Provide ONLY a single number between -10 and 10 representing the political leaning score.
      Return ONLY the numerical score with no additional text.
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      maxTokens: 10,
    })

    // Log the raw response for debugging
    console.log("Raw political score response:", text)

    // Extract the number from the response
    const score = Number.parseFloat(text.trim())
    console.log("Parsed political score:", score)

    // Validate the score
    if (isNaN(score) || score < -10 || score > 10) {
      console.log("Invalid score, using source-based fallback")
      // Fallback to a source-based score if the AI response is invalid
      return getSourceBasedScore(article.source, article.title, article.description)
    }

    return score
  } catch (error) {
    console.error("Error analyzing political leaning:", error)
    return getSourceBasedScore(article.source, article.title, article.description)
  }
}

// Fallback function to get a political score based on the source and content
function getSourceBasedScore(source: string, title: string, description: string): number {
  // Base score from source
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

  // Add some randomness to make each score unique
  score += Math.random() * 2 - 1 // Add between -1 and +1

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

// Analyze the political leaning of a comment using OpenAI
export async function analyzeCommentPoliticalLeaning(comment: string): Promise<{
  summary: string
  politicalScore: number
}> {
  try {
    const prompt = `
      Please analyze the political leaning of the following comment and provide:
      1. A brief summary (1-2 sentences)
      2. A political leaning score from -10 (extremely liberal) to +10 (extremely conservative)
      
      Comment: "${comment}"
      
      Format your response as JSON with the following structure:
      {
        "summary": "Brief summary of the comment",
        "politicalScore": number from -10 to 10
      }
      
      Return ONLY the JSON with no additional text or markdown formatting.
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      maxTokens: 200,
    })

    try {
      // Clean the response to extract just the JSON
      let jsonText = text.trim()

      // Remove markdown code block syntax if present
      if (jsonText.startsWith("```")) {
        // Find the first and last occurrence of \`\`\`
        const firstDelimiter = jsonText.indexOf("```")
        const lastDelimiter = jsonText.lastIndexOf("```")

        if (firstDelimiter !== lastDelimiter) {
          // Extract content between the delimiters
          jsonText = jsonText.substring(firstDelimiter + 3, lastDelimiter).trim()

          // If there's a language specifier like \`\`\`json, remove the first line
          const firstLineBreak = jsonText.indexOf("\n")
          if (firstLineBreak > 0 && jsonText.substring(0, firstLineBreak).includes("json")) {
            jsonText = jsonText.substring(firstLineBreak).trim()
          }
        }
      }

      // Parse the cleaned JSON
      const result = JSON.parse(jsonText)

      // Validate the result
      if (typeof result.summary !== "string" || typeof result.politicalScore !== "number") {
        throw new Error("Invalid response format")
      }

      // Ensure the score is within bounds
      const score = Math.max(-10, Math.min(10, result.politicalScore))

      return {
        summary: result.summary,
        politicalScore: score,
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      console.log("Raw response:", text)

      // Fallback to a simple analysis
      return {
        summary: "This comment expresses a viewpoint on the topic.",
        politicalScore: 0,
      }
    }
  } catch (error) {
    console.error("Error analyzing comment political leaning:", error)
    return {
      summary: "This comment expresses a viewpoint on the topic.",
      politicalScore: 0,
    }
  }
}

// Extract location data from an article using OpenAI
export async function extractArticleLocation(article: Article): Promise<{
  location: string
  coordinates: { lat: number; lng: number } | null
  confidence: number
}> {
  try {
    const prompt = `
      Please analyze the following news article and extract the primary geographic location it relates to.
      
      Title: ${article.title}
      Source: ${article.source}
      Description: ${article.description}
      ${article.content ? `Content: ${article.content}` : ""}
      
      Return your response in JSON format with the following structure:
      {
        "location": "Name of city/country/region",
        "coordinates": { "lat": latitude, "lng": longitude },
        "confidence": a number between 0 and 1 representing your confidence in this location extraction
      }
      
      If you cannot determine a specific geographic location, set coordinates to null.
      Return ONLY the JSON with no additional text.
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      maxTokens: 200,
    })

    try {
      // Log the raw response for debugging
      console.log("Raw OpenAI location response:", text)

      // Clean the response to extract just the JSON
      let jsonText = text.trim()

      // Remove markdown code block syntax if present
      if (jsonText.includes("```")) {
        // Find the content between the first \`\`\` and the last \`\`\`
        const startIndex = jsonText.indexOf("```")
        const endIndex = jsonText.lastIndexOf("```")

        if (startIndex !== -1 && endIndex !== -1 && startIndex !== endIndex) {
          // Extract content between the delimiters
          jsonText = jsonText.substring(startIndex + 3, endIndex).trim()

          // If there's a language specifier like \`\`\`json, remove it
          const firstLineBreak = jsonText.indexOf("\n")
          if (firstLineBreak > 0 && jsonText.substring(0, firstLineBreak).includes("json")) {
            jsonText = jsonText.substring(firstLineBreak).trim()
          }
        }
      }

      // Try to parse the JSON
      let result
      try {
        result = JSON.parse(jsonText)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)

        // Try to extract JSON using regex as a fallback
        const jsonRegex = /{[\s\S]*}/
        const match = jsonText.match(jsonRegex)

        if (match) {
          try {
            result = JSON.parse(match[0])
          } catch (regexParseError) {
            console.error("Regex JSON parse error:", regexParseError)
            throw new Error("Could not parse JSON from response")
          }
        } else {
          throw new Error("No JSON object found in response")
        }
      }

      // Validate the result
      if (!result || typeof result.location !== "string") {
        throw new Error("Missing location in response")
      }

      // Ensure coordinates are properly formatted if present
      if (
        result.coordinates &&
        (typeof result.coordinates.lat !== "number" || typeof result.coordinates.lng !== "number")
      ) {
        // Try to convert string coordinates to numbers
        if (result.coordinates.lat && result.coordinates.lng) {
          result.coordinates.lat = Number.parseFloat(String(result.coordinates.lat))
          result.coordinates.lng = Number.parseFloat(String(result.coordinates.lng))
        } else {
          result.coordinates = null
        }
      }

      // Ensure confidence is a number
      if (typeof result.confidence !== "number") {
        result.confidence = result.confidence ? Number.parseFloat(String(result.confidence)) : 0.5
      }

      return {
        location: result.location,
        coordinates: result.coordinates,
        confidence: result.confidence,
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI location response:", parseError)
      console.log("Raw response:", text)

      // Try to extract just a location name as a fallback
      let locationName = article.source || "Unknown Location"

      // Try to extract location from title or description
      if (article.title && (article.title.includes("in ") || article.title.includes("at "))) {
        const titleMatch = article.title.match(/(?:in|at)\s+([A-Z][a-zA-Z\s]+)(?:,|\s|$)/)
        if (titleMatch && titleMatch[1]) {
          locationName = titleMatch[1].trim()
        }
      }

      // Return default fallback
      return {
        location: locationName,
        coordinates: null,
        confidence: 0,
      }
    }
  } catch (error) {
    console.error("Error extracting article location:", error)
    // Return default fallback
    return {
      location: article.source || "Unknown Location",
      coordinates: null,
      confidence: 0,
    }
  }
}

