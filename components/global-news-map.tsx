"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Globe, MapPin, ExternalLink, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import { getGuestId } from "@/lib/supabase"
import dynamic from "next/dynamic"

// Dynamically import Globe.GL to avoid SSR issues
const GlobeGL = dynamic(() => import("react-globe.gl").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  ),
})

type ArticleLocation = {
  id: string
  title: string
  description?: string
  source: string
  source_type: "left" | "center" | "right"
  political_score?: number
  published_at: string
  url: string
  location: string
  lat: number
  lng: number
  read_at?: string
  region?: string
}

export function GlobalNewsMap() {
  const [articles, setArticles] = useState<ArticleLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<ArticleLocation | null>(null)
  const [showUserOnly, setShowUserOnly] = useState(false)
  const [globeReady, setGlobeReady] = useState(false)
  const globeRef = useRef<any>(null)
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"

  // Always use fallback data to ensure the globe has something to display
  useEffect(() => {
    // Set fallback data immediately to ensure we always have something to show
    setArticles(getFallbackArticles())

    // Then try to fetch real data
    fetchArticleLocations()
  }, [])

  // Fetch article locations when showUserOnly changes
  useEffect(() => {
    fetchArticleLocations()
  }, [showUserOnly])

  // Fetch article locations
  async function fetchArticleLocations() {
    setLoading(true)
    setError(null)

    try {
      const guestId = await getGuestId()
      const response = await fetch(`/api/article-locations?guestId=${guestId}&userOnly=${showUserOnly}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch article locations: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Add region based on coordinates
        const articlesWithRegions = data.data
          .filter(
            (article: any) =>
              article &&
              article.id &&
              typeof article.lat === "number" &&
              typeof article.lng === "number" &&
              !isNaN(article.lat) &&
              !isNaN(article.lng),
          )
          .map((article: ArticleLocation) => ({
            ...article,
            region: getRegionFromCoordinates(article.lat, article.lng),
          }))

        if (articlesWithRegions.length > 0) {
          setArticles(articlesWithRegions)
        }
      }
    } catch (error: any) {
      console.error("Error fetching article locations:", error)
      setError(error.message || "Failed to load article locations")
      // Keep using fallback data
    } finally {
      setLoading(false)
    }
  }

  // Handle globe ready state
  const handleGlobeReady = () => {
    console.log("Globe is ready")
    setGlobeReady(true)

    // Set a small delay to ensure the globe is fully initialized
    setTimeout(() => {
      try {
        if (globeRef.current && typeof globeRef.current.controls === "function") {
          const controls = globeRef.current.controls()
          if (controls) {
            controls.autoRotate = true
            controls.autoRotateSpeed = 0.5
          }
        }
      } catch (err) {
        console.error("Error setting globe controls:", err)
      }
    }, 500)
  }

  // Determine region based on coordinates
  function getRegionFromCoordinates(lat: number, lng: number): string {
    // Simple region determination based on coordinates
    if (lat > 0 && lng < 0) return "North America"
    if (lat > 0 && lng > 0 && lng < 65) return "Europe"
    if (lat > 0 && lng >= 65) return "Asia"
    if (lat < 0 && lng > 0) return "Oceania"
    if (lat < 0 && lng < -20) return "South America"
    if (lat < 0 && lng >= -20) return "Africa"
    return "Other"
  }

  // Get fallback articles if no real data is available
  function getFallbackArticles(): ArticleLocation[] {
    return [
      {
        id: "1",
        title: "Climate Summit Reaches Historic Agreement",
        source: "Global News Network",
        source_type: "center",
        political_score: -2.5,
        published_at: new Date().toISOString(),
        url: "#",
        location: "Paris, France",
        lat: 48.8566,
        lng: 2.3522,
        region: "Europe",
      },
      {
        id: "2",
        title: "Tech Giants Face New Regulations",
        source: "Tech Today",
        source_type: "center",
        political_score: 0.8,
        published_at: new Date().toISOString(),
        url: "#",
        location: "San Francisco, USA",
        lat: 37.7749,
        lng: -122.4194,
        region: "North America",
      },
      {
        id: "3",
        title: "Economic Forum Discusses Global Trade",
        source: "Business Daily",
        source_type: "right",
        political_score: 1.2,
        published_at: new Date().toISOString(),
        url: "#",
        location: "Singapore",
        lat: 1.3521,
        lng: 103.8198,
        region: "Asia",
      },
      {
        id: "4",
        title: "Renewable Energy Initiative Launched",
        source: "Science News",
        source_type: "left",
        political_score: -3.1,
        published_at: new Date().toISOString(),
        url: "#",
        location: "Sydney, Australia",
        lat: -33.8688,
        lng: 151.2093,
        region: "Oceania",
      },
      {
        id: "5",
        title: "Peace Talks Resume After Months of Tension",
        source: "World Report",
        source_type: "center",
        political_score: 0.3,
        published_at: new Date().toISOString(),
        url: "#",
        location: "Cairo, Egypt",
        lat: 30.0444,
        lng: 31.2357,
        region: "Africa",
      },
      {
        id: "6",
        title: "Trade Agreement Signed Between Nations",
        source: "Economic Times",
        source_type: "left",
        political_score: -1.7,
        published_at: new Date().toISOString(),
        url: "#",
        location: "Brasilia, Brazil",
        lat: -15.7801,
        lng: -47.9292,
        region: "South America",
      },
    ]
  }

  // Filter articles by selected region
  const filteredArticles = selectedRegion ? articles.filter((article) => article.region === selectedRegion) : articles

  // Prepare data for the globe
  const markerData = filteredArticles.map((article) => ({
    ...article,
    size: 0.5,
    color: getColorFromScore(article.political_score || 0),
  }))

  // Get color based on political score
  function getColorFromScore(score: number): string {
    if (score <= -7) return "#2563eb" // blue-600
    if (score <= -3) return "#3b82f6" // blue-500
    if (score < 3) return "#a855f7" // purple-500
    if (score < 7) return "#ef4444" // red-500
    return "#dc2626" // red-600
  }

  // Get badge color class based on political score
  function getPoliticalScoreColor(score: number): string {
    if (score <= -7)
      return "border-blue-700 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
    if (score <= -3)
      return "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
    if (score < 3)
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
    if (score < 7)
      return "border-red-500 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300"
    return "border-red-700 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/70 dark:text-red-300"
  }

  // Get unique regions for filter
  const regions = Array.from(new Set(articles.map((article) => article.region || "Unknown")))
    .filter((region) => region !== "Unknown")
    .sort()

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Global News Pulse</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowUserOnly(!showUserOnly)} className="text-xs">
            {showUserOnly ? "Show All Articles" : "Show My Articles"}
          </Button>
        </div>
        <CardDescription>Explore news stories from around the world</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {regions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {regions.map((region) => (
              <Badge
                key={region}
                variant={selectedRegion === region ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
              >
                {region}
              </Badge>
            ))}
          </div>
        )}

        <div className="relative h-[300px] w-full">
          {loading && articles.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading article locations...</p>
              </div>
            </div>
          ) : typeof window !== "undefined" ? (
            <GlobeGL
              ref={globeRef}
              globeImageUrl={
                isDarkTheme
                  ? "//unpkg.com/three-globe/example/img/earth-night.jpg"
                  : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              }
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundColor="rgba(0,0,0,0)"
              width={500}
              height={300}
              pointsData={markerData}
              pointLat="lat"
              pointLng="lng"
              pointColor="color"
              pointAltitude={0.01}
              pointRadius="size"
              pointLabel="title"
              onPointClick={(point) => setSelectedArticle(point)}
              pointsTransitionDuration={300}
              onGlobeReady={handleGlobeReady}
            />
          ) : null}
        </div>

        {selectedArticle && (
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedArticle.location}</span>
              {selectedArticle.political_score !== undefined && (
                <Badge variant="outline" className={getPoliticalScoreColor(selectedArticle.political_score)}>
                  {selectedArticle.political_score.toFixed(1)}
                </Badge>
              )}
            </div>
            <h3 className="font-medium">{selectedArticle.title}</h3>
            <p className="text-sm text-muted-foreground">{selectedArticle.source}</p>
            <Button size="sm" variant="outline" className="w-full gap-1" asChild>
              <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer">
                <span>Read Article</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        )}

        {!selectedArticle && globeReady && articles.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Click on a marker to view news from that location</p>
            <p className="text-xs mt-1">Explore diverse perspectives from around the globe</p>
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="text-center text-sm text-muted-foreground">
            <p>No articles with location data available</p>
            <p className="text-xs mt-1">Read more articles to see them appear on the globe</p>
          </div>
        )}

        {articles.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Articles with Location Data</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {articles.map((article) => (
                <div key={article.id} className="text-xs border rounded-md p-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{article.location}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {article.region || "Unknown"}
                    </Badge>
                  </div>
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {article.title}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

