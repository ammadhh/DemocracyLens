"use client"

import { useState } from "react"
import { Search, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

interface NewsSearchProps {
  onSearch: (query: string, fromDate: Date | undefined, sortBy: string) => void
}

export function NewsSearch({ onSearch }: NewsSearchProps) {
  const [query, setQuery] = useState("")
  const [date, setDate] = useState<Date>()
  const [sortBy, setSortBy] = useState("publishedAt")

  const handleSearch = () => {
    onSearch(query, date, sortBy)
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search news..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Calendar className="h-4 w-4" />
                {date ? format(date, "MMM dd, yyyy") : "Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publishedAt">Newest</SelectItem>
              <SelectItem value="relevancy">Relevance</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSearch} className="w-full sm:w-auto">
          Search
        </Button>
      </div>

      {(query || date || sortBy !== "publishedAt") && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {query && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => {
                setQuery("")
                handleSearch()
              }}
            >
              Query: {query}
              <span className="ml-1">×</span>
            </Button>
          )}
          {date && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => {
                setDate(undefined)
                handleSearch()
              }}
            >
              From: {format(date, "MMM dd, yyyy")}
              <span className="ml-1">×</span>
            </Button>
          )}
          {sortBy !== "publishedAt" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => {
                setSortBy("publishedAt")
                handleSearch()
              }}
            >
              Sort: {sortBy === "relevancy" ? "Relevance" : "Popularity"}
              <span className="ml-1">×</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setQuery("")
              setDate(undefined)
              setSortBy("publishedAt")
              onSearch("", undefined, "publishedAt")
            }}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

