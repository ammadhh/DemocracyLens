import { NewsFeed } from "@/components/news-feed"
import { BalancedReadingRecommendations } from "@/components/balanced-reading-recommendations"
import { GamificationFeatures } from "@/components/gamification-features"

export default function NewsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 pt-16 md:pt-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">News Feed</h1>
        <p className="text-muted-foreground">Explore diverse news sources and perspectives</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <NewsFeed />
        </div>
        <div className="space-y-6 md:col-span-4">
          <BalancedReadingRecommendations />
          <GamificationFeatures />
        </div>
      </div>
    </div>
  )
}

