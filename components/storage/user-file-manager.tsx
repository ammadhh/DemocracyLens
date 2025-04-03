"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  type FileCategory,
  type StoredFile,
  listUserFiles,
  uploadUserFile,
  deleteUserFile,
} from "@/lib/storage-service"
import { File, FileImage, FileText, Loader2, Trash2, Upload, Download, FileArchive } from "lucide-react"

export function UserFileManager() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<FileCategory>("images")
  const [files, setFiles] = useState<StoredFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchFiles()
    }
  }, [user, activeTab])

  const fetchFiles = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const userFiles = await listUserFiles(user.id, activeTab)
      setFiles(userFiles)
    } catch (error) {
      console.error("Error fetching files:", error)
      toast({
        title: "Error",
        description: "Failed to load your files",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return

    const file = e.target.files[0]

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const result = await uploadUserFile(file, user.id, activeTab)

      if (result) {
        setFiles((prev) => [...prev, result])
        toast({
          title: "File uploaded",
          description: "Your file has been uploaded successfully",
        })
      } else {
        throw new Error("Failed to upload file")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteFile = async (file: StoredFile) => {
    if (!user) return

    try {
      const success = await deleteUserFile(user.id, activeTab, file.name)

      if (success) {
        setFiles((prev) => prev.filter((f) => f.name !== file.name))
        toast({
          title: "File deleted",
          description: "Your file has been deleted successfully",
        })
      } else {
        throw new Error("Failed to delete file")
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Delete failed",
        description: "There was an error deleting your file",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (file: StoredFile) => {
    if (file.type.startsWith("image/")) {
      return <FileImage className="h-8 w-8 text-blue-500" />
    } else if (file.type.startsWith("text/")) {
      return <FileText className="h-8 w-8 text-amber-500" />
    } else if (file.type.includes("pdf")) {
      return <FileText className="h-8 w-8 text-red-500" />
    } else if (file.type.includes("zip") || file.type.includes("archive")) {
      return <FileArchive className="h-8 w-8 text-purple-500" />
    }
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Please sign in to manage your files</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Files</CardTitle>
        <CardDescription>Manage your uploaded files</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="images" value={activeTab} onValueChange={(value) => setActiveTab(value as FileCategory)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading files..." : `${files.length} files`}
              </p>
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No files found</p>
                <p className="text-xs text-muted-foreground mt-1">Upload files to see them here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {files.map((file) => (
                  <div key={file.path} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

