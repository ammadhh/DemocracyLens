"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Users } from "lucide-react"

type PollOption = {
  id: number
  text: string
  votes: number
}

export function InteractivePoll() {
  const [poll, setPoll] = useState({
    question: "Will the new climate bill pass this month?",
    options: [
      { id: 1, text: "Yes, with bipartisan support", votes: 342 },
      { id: 2, text: "Yes, but along party lines", votes: 518 },
      { id: 3, text: "No, it will be delayed", votes: 276 },
      { id: 4, text: "No, it will be rejected", votes: 164 },
    ],
    totalVotes: 1300,
    userVote: null as number | null,
  })

  const handleVote = (optionId: number) => {
    if (poll.userVote !== null) return

    setPoll((prev) => {
      const newOptions = prev.options.map((option) =>
        option.id === optionId ? { ...option, votes: option.votes + 1 } : option,
      )

      return {
        ...prev,
        options: newOptions,
        totalVotes: prev.totalVotes + 1,
        userVote: optionId,
      }
    })
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Community Poll</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{poll.totalVotes.toLocaleString()} votes</span>
          </div>
        </div>
        <CardDescription>Predict outcomes of news events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="font-medium">{poll.question}</h3>

          <div className="space-y-3">
            {poll.options.map((option) => {
              const percentage = Math.round((option.votes / poll.totalVotes) * 100)
              const isSelected = poll.userVote === option.id

              return (
                <div key={option.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isSelected ? "font-medium" : ""}>{option.text}</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={percentage}
                      className={`h-2 ${isSelected ? "bg-muted" : ""}`}
                      indicatorClassName={isSelected ? "bg-primary" : ""}
                    />
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      className="h-7 w-16 shrink-0"
                      onClick={() => handleVote(option.id)}
                      disabled={poll.userVote !== null}
                    >
                      {isSelected ? "Voted" : "Vote"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Your prediction matters!</p>
            <p className="text-muted-foreground">Earn points for accurate predictions when results are announced.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

