"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, BookOpen, Database, Home, Menu, Newspaper, User, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/sidebar-provider"
import { useEffect, useState } from "react"
import { getGuestId, getUserReadingHistory } from "@/lib/supabase"
import { calculateDemocracyScore } from "@/lib/democracy-utils"
import { useAuth } from "@/lib/auth-context"
import { UserAuthStatus } from "@/components/auth/user-auth-status"
import { ThemeToggle } from "@/components/theme-toggle"

export function AppSidebar() {
  const pathname = usePathname()
  const { open, toggleSidebar, setOpen, isMobile } = useSidebar()
  const [democracyScore, setDemocracyScore] = useState(75)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setOpen(false)
    }
  }, [pathname, isMobile, setOpen])

  // Fetch democracy score
  useEffect(() => {
    async function fetchDemocracyScore() {
      try {
        const guestId = await getGuestId()
        const history = await getUserReadingHistory(guestId, 50, 0)

        const { score } = calculateDemocracyScore(history)
        setDemocracyScore(score)
      } catch (error) {
        console.error("Error fetching democracy score:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDemocracyScore()
  }, [])

  const routes = [
    {
      name: "Dashboard",
      path: "/",
      icon: Home,
    },
    {
      name: "News Feed",
      path: "/news",
      icon: BookOpen,
    },
    {
      name: "NYT News",
      path: "/nyt-news",
      icon: Newspaper,
    },
    {
      name: "Statistics",
      path: "/statistics",
      icon: BarChart3,
    },
    {
      name: "Storage",
      path: "/storage",
      icon: Database,
    },
  ]

  // Add profile route if user is logged in
  if (user) {
    routes.push({
      name: "Profile",
      path: "/profile",
      icon: User,
    })
  }

  // Get democracy score rating
  const getDemocracyRating = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Very Good"
    if (score >= 70) return "Good"
    if (score >= 60) return "Fair"
    if (score >= 50) return "Average"
    if (score >= 40) return "Below Average"
    if (score >= 30) return "Poor"
    return "Very Poor"
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ease-in-out"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "z-50 flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out",
          isMobile ? "fixed inset-y-0 left-0 w-64 shadow-xl" : "sticky top-0 h-screen",
          isMobile && !open && "-translate-x-full",
          !isMobile && (open ? "w-64" : "w-16"),
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          {(open || isMobile) && (
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="h-6 w-6 rounded-full bg-primary"></span>
              <span className="text-lg">Democracy Lens</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
            {isMobile && open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-2">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === route.path ? "bg-accent text-accent-foreground" : "transparent",
                )}
              >
                <route.icon className={cn("mr-2 h-5 w-5", !open && !isMobile ? "mx-auto" : "")} />
                {(open || isMobile) && <span>{route.name}</span>}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t p-4">
          {(open || isMobile) && (
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium">Democracy Score</div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
                  style={{ width: `${democracyScore}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">
                {loading ? "Calculating..." : `${democracyScore}/100 - ${getDemocracyRating(democracyScore)}`}
              </div>
            </div>
          )}
        </div>
        <div className="border-t p-4 flex justify-center">
          <ThemeToggle />
        </div>
        <UserAuthStatus expanded={open || isMobile} />
      </div>
    </>
  )
}

