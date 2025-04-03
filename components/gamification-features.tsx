import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Award, Clock, Target, Trophy } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function GamificationFeatures() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <CardTitle>Your Achievements</CardTitle>
        </div>
        <CardDescription>Track your progress and earn rewards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Level Progress</h3>
            <span className="text-sm font-medium">Level 7</span>
          </div>
          <Progress value={65} className="h-2" />
          <p className="text-xs text-muted-foreground">325 more points to reach Level 8</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Recent Badges</h3>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col items-center gap-1 rounded-lg border p-2">
              <Award className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium">Critical Thinker</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg border p-2">
              <Target className="h-6 w-6 text-green-500" />
              <span className="text-xs font-medium">Fact Checker</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg border p-2">
              <Clock className="h-6 w-6 text-orange-500" />
              <span className="text-xs font-medium">Daily Reader</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-3">
          <h3 className="mb-2 text-sm font-medium">Active Challenges</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs">Read 5 articles today</span>
                <Badge variant="secondary" className="text-xs">
                  2/5
                </Badge>
              </div>
              <Badge variant="outline" className="text-xs">
                +30 pts
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs">7-day streak</span>
                <Badge variant="secondary" className="text-xs">
                  5/7
                </Badge>
              </div>
              <Badge variant="outline" className="text-xs">
                +100 pts
              </Badge>
            </div>
          </div>
        </div>

        <Button size="sm" className="w-full">
          View All Achievements
        </Button>
      </CardContent>
    </Card>
  )
}

