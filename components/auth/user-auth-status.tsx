"use client"

import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogIn } from "lucide-react"

export function UserAuthStatus({ expanded = true }: { expanded?: boolean }) {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="border-t p-4">
        {expanded ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium">Not signed in</p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/auth/login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button asChild size="icon" variant="ghost">
              <Link href="/auth/login">
                <LogIn className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Get initials from username or email
  const getInitials = () => {
    const username = user.user_metadata?.username
    if (username) {
      return username.substring(0, 2).toUpperCase()
    }
    return user.email?.substring(0, 2).toUpperCase() || "U"
  }

  return (
    <div className="border-t p-4">
      {expanded ? (
        <Link href="/profile" className="flex items-center gap-3 hover:opacity-80">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.user_metadata?.username || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </Link>
      ) : (
        <div className="flex justify-center">
          <Link href="/profile">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      )}
    </div>
  )
}

