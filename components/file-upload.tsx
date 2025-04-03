"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { uploadFile, deleteFile } from "@/lib/supabase"
import { Loader2, Upload, X, FileIcon, ImageIcon, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type FileUploadProps = {
  bucket?: string
  path?: string
  onUploadComplete?: (url: string) => void
}

export function FileUpload({ bucket = "articles", path = "images", onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadedUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      // Generate a unique file path
      const timestamp = new Date().getTime()
      const filePath = `${path}/${timestamp}_${file.name}`

      // Upload the file
      const url = await uploadFile(bucket, filePath, file)

      if (!url) {
        throw new Error("Failed to upload file")
      }

      setUploadedUrl(url)

      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(url)
      }

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      })
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your file.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDelete = async () => {
    if (!uploadedUrl) return

    try {
      // Extract the path from the URL
      const url = new URL(uploadedUrl)
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/(.*)/i)

      if (!pathMatch || !pathMatch[1]) {
        throw new Error("Invalid file URL")
      }

      const filePath = decodeURIComponent(pathMatch[1].split("/").slice(1).join("/"))

      // Delete the file
      const success = await deleteFile(bucket, [filePath])

      if (!success) {
        throw new Error("Failed to delete file")
      }

      setUploadedUrl(null)
      setFile(null)

      toast({
        title: "File deleted",
        description: "Your file has been deleted successfully.",
      })
    } catch (error: any) {
      console.error("Error deleting file:", error)
      toast({
        title: "Delete failed",
        description: error.message || "There was an error deleting your file.",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = () => {
    if (!file) return <Upload className="h-8 w-8 text-muted-foreground" />

    const fileType = file.type.split("/")[0]

    switch (fileType) {
      case "image":
        return <ImageIcon className="h-8 w-8 text-blue-500" />
      case "text":
      case "application":
        return <FileText className="h-8 w-8 text-amber-500" />
      default:
        return <FileIcon className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>File Upload</CardTitle>
        <CardDescription>Upload files to your storage bucket</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`
            flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6
            ${file ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
            ${!uploading && !uploadedUrl ? "cursor-pointer hover:border-primary/50" : ""}
          `}
          onClick={() => {
            if (!uploading && !uploadedUrl && fileInputRef.current) {
              fileInputRef.current.click()
            }
          }}
        >
          <div className="mb-2">{getFileIcon()}</div>

          <div className="text-center">
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB • {file.type || "Unknown type"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium">Drag and drop or click to upload</p>
                <p className="text-xs text-muted-foreground">Supports images, documents, and other files</p>
              </div>
            )}
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading || !!uploadedUrl}
          />
        </div>

        {uploadedUrl && (
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <FileIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">File uploaded successfully</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{uploadedUrl}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-destructive">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleClear} disabled={!file || uploading || !!uploadedUrl}>
          Clear
        </Button>
        <Button onClick={handleUpload} disabled={!file || uploading || !!uploadedUrl}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

