import { NytNewsFeed } from "@/components/nyt-news-feed"

export default function NytNewsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 pt-16 md:pt-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">New York Times</h1>
        <p className="text-muted-foreground">Explore news from The New York Times</p>
      </div>

      <div className="grid gap-6">
        <NytNewsFeed />
      </div>
    </div>
  )
}

