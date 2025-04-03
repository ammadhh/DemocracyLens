import type { ReadingHistoryItem } from "@/lib/supabase"

// Calculate democracy score based on reading history
export function calculateDemocracyScore(readingHistory: ReadingHistoryItem[]): {
  score: number
  dimensions: {
    mediaFreedom: number
    electoralProcess: number
    civilLiberties: number
    ruleOfLaw: number
    deliberation: number
  }
} {
  // Default score if no history
  if (!readingHistory || readingHistory.length === 0) {
    return {
      score: 50,
      dimensions: {
        mediaFreedom: 50,
        electoralProcess: 50,
        civilLiberties: 50,
        ruleOfLaw: 50,
        deliberation: 50,
      },
    }
  }

  // Get all articles from reading history
  const articles = readingHistory.map((item) => item.article).filter(Boolean)

  // Calculate source diversity (media freedom)
  const uniqueSources = new Set(articles.map((article) => article.source)).size
  const mediaFreedom = Math.min(100, 50 + uniqueSources * 10)

  // Calculate political balance (deliberation)
  const politicalScores = articles
    .filter((article) => article.political_score !== undefined)
    .map((article) => article.political_score as number)

  let deliberation = 50
  if (politicalScores.length > 0) {
    // Check if there's a balance of perspectives
    const leftArticles = politicalScores.filter((score) => score < 0).length
    const rightArticles = politicalScores.filter((score) => score > 0).length
    const centerArticles = politicalScores.filter((score) => score >= -3 && score <= 3).length

    // Calculate balance ratio (higher is better)
    const min = Math.min(leftArticles, rightArticles)
    const max = Math.max(leftArticles, rightArticles)
    const balanceRatio = max > 0 ? min / max : 0

    // Adjust deliberation score based on balance and center articles
    deliberation = 50 + balanceRatio * 30 + centerArticles * 2
    deliberation = Math.min(100, deliberation)
  }

  // Other dimensions can be calculated based on article topics
  // For now, use simpler calculations
  const electoralProcess = 50 + (articles.length > 5 ? 15 : 0) + (uniqueSources > 3 ? 15 : 0)
  const civilLiberties = 50 + (articles.length > 3 ? 25 : 0)
  const ruleOfLaw = 50 + (articles.length > 4 ? 20 : 0)

  // Calculate overall score (weighted average)
  const score = Math.round(
    mediaFreedom * 0.3 + deliberation * 0.3 + electoralProcess * 0.15 + civilLiberties * 0.15 + ruleOfLaw * 0.1,
  )

  return {
    score,
    dimensions: {
      mediaFreedom,
      electoralProcess,
      civilLiberties,
      ruleOfLaw,
      deliberation,
    },
  }
}

// Check if a challenge is completed based on reading history
export function checkChallengeCompletion(challengeId: number, readingHistory: ReadingHistoryItem[]): boolean {
  if (!readingHistory || readingHistory.length === 0) {
    return false
  }

  const articles = readingHistory.map((item) => item.article).filter(Boolean)

  // Get today's articles
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayArticles = readingHistory
    .filter((item) => {
      const readDate = new Date(item.read_at)
      readDate.setHours(0, 0, 0, 0)
      return readDate.getTime() === today.getTime()
    })
    .map((item) => item.article)
    .filter(Boolean)

  switch (challengeId) {
    // "Explore Opposing Viewpoints"
    case 1:
      const hasLiberal = todayArticles.some(
        (article) => article.political_score !== undefined && article.political_score < 0,
      )
      const hasConservative = todayArticles.some(
        (article) => article.political_score !== undefined && article.political_score > 0,
      )
      return hasLiberal && hasConservative

    // "Discover New Sources"
    case 2:
      const uniqueSources = new Set(todayArticles.map((article) => article.source))
      return uniqueSources.size >= 3

    // "Fact Check Challenge"
    case 3:
      // This would require more complex logic in a real app
      // For demo purposes, consider it completed if they've read 3+ articles today
      return todayArticles.length >= 3

    default:
      return false
  }
}

// Get reading streak data for the calendar
export function getReadingStreakData(readingHistory: ReadingHistoryItem[]): {
  currentStreak: number
  longestStreak: number
  daysInMonth: {
    date: Date
    day: number
    hasStreak: boolean
    streakIntensity: number
    isToday: boolean
  }[]
} {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Create a map of days with reading activity
  const readingDays = new Map<number, number>()

  readingHistory.forEach((item) => {
    const readDate = new Date(item.read_at)
    // Only count current month
    if (readDate.getMonth() === currentMonth && readDate.getFullYear() === currentYear) {
      const day = readDate.getDate()
      readingDays.set(day, (readingDays.get(day) || 0) + 1)
    }
  })

  // Calculate current streak
  let currentStreak = 0
  const checkDate = new Date()
  checkDate.setHours(0, 0, 0, 0)

  while (true) {
    const day = checkDate.getDate()
    if (readingDays.has(day)) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  // Calculate longest streak (simplified)
  const longestStreak = Math.max(currentStreak, readingDays.size > 5 ? 7 : 5)

  // Generate calendar data
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const date = new Date(currentYear, currentMonth, day)
    const isToday = date.getDate() === today.getDate()
    const hasStreak = readingDays.has(day)

    // Streak intensity based on number of articles read
    const articlesRead = readingDays.get(day) || 0
    const streakIntensity = hasStreak ? (articlesRead >= 5 ? 3 : articlesRead >= 3 ? 2 : 1) : 0

    return {
      date,
      day,
      hasStreak,
      streakIntensity,
      isToday,
    }
  })

  return {
    currentStreak,
    longestStreak,
    daysInMonth: days,
  }
}

