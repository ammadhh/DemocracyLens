import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BarChart2, Scale } from "lucide-react"

export function BalancedReadingRecommendations() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <CardTitle>Balance Your Reading</CardTitle>
        </div>
        <CardDescription>Recommendations to diversify your news consumption</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-3">
          <div className="mb-2 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Your Reading Pattern</h3>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Based on your history, you tend to read more from liberal sources. Consider exploring these alternative
            perspectives:
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
                >
                  Conservative
                </Badge>
                <span className="text-sm font-medium">Economic Policy</span>
              </div>
              <Button size="sm" variant="ghost" className="h-7 gap-1">
                <span>Explore</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                >
                  Neutral
                </Badge>
                <span className="text-sm font-medium">Foreign Policy</span>
              </div>
              <Button size="sm" variant="ghost" className="h-7 gap-1">
                <span>Explore</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-dashed p-3">
          <h3 className="mb-2 font-medium">Challenge: Opposing Viewpoints</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Read these two articles on the same topic from different perspectives to earn 50 points.
          </p>
          <div className="space-y-2">
            <Button size="sm" variant="outline" className="w-full justify-between">
              <span>Climate Policy (Liberal)</span>
              <Badge variant="secondary">+25 pts</Badge>
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-between">
              <span>Climate Policy (Conservative)</span>
              <Badge variant="secondary">+25 pts</Badge>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

