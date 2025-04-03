"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { updateProfilePicture } from "@/lib/storage-service"
import { useToast } from "@/hooks/use-toast"
import { Camera, Loader2, X } from "lucide-react"

export function ProfilePictureUpload() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return

    const file = e.target.files[0]

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const url = await updateProfilePicture(user.id, file)

      if (url) {
        setAvatarUrl(url)
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully",
        })
      } else {
        throw new Error("Failed to update profile picture")
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your profile picture",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveAvatar = async () => {
    // This would ideally remove the avatar, but for simplicity we'll just clear the URL
    setAvatarUrl(null)
    toast({
      title: "Profile picture removed",
      description: "Your profile picture has been removed",
    })
  }

  // Get initials from email or username
  const getInitials = () => {
    const username = user?.user_metadata?.username
    if (username) {
      return username.substring(0, 2).toUpperCase()
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U"
  }

  if (!user) return null

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
            <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
          </Avatar>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </>
              )}
            </Button>

            {avatarUrl && (
              <Button variant="outline" size="sm" onClick={handleRemoveAvatar} disabled={isUploading}>
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

