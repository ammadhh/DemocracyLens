import { getSupabaseClient } from "@/lib/supabase"

// Define file types for better organization
export type FileCategory = "profile" | "articles" | "documents" | "images"

export type StoredFile = {
  name: string
  size: number
  type: string
  url: string
  path: string
  created_at: string
}

// Get bucket name based on file category
export const getBucketForCategory = (category: FileCategory): string => {
  switch (category) {
    case "profile":
      return "profiles"
    case "articles":
      return "articles"
    case "documents":
      return "documents"
    case "images":
      return "images"
    default:
      return "public"
  }
}

// Get path prefix for user files
export const getUserPathPrefix = (userId: string, category: FileCategory): string => {
  return `${userId}/${category}`
}

// Upload a file to storage
export const uploadUserFile = async (
  file: File,
  userId: string,
  category: FileCategory,
  customFilename?: string,
): Promise<StoredFile | null> => {
  try {
    const supabase = getSupabaseClient()
    const bucket = getBucketForCategory(category)
    const pathPrefix = getUserPathPrefix(userId, category)

    // Generate a unique filename if not provided
    const filename = customFilename || `${Date.now()}_${file.name.replace(/\s+/g, "_")}`
    const filePath = `${pathPrefix}/${filename}`

    // Upload the file
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.error("Error uploading file:", error)
      return null
    }

    // Get the public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      name: filename,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      path: data.path,
      created_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error in uploadUserFile:", error)
    return null
  }
}

// List user files
export const listUserFiles = async (userId: string, category: FileCategory): Promise<StoredFile[]> => {
  try {
    const supabase = getSupabaseClient()
    const bucket = getBucketForCategory(category)
    const pathPrefix = getUserPathPrefix(userId, category)

    // List files in the path
    const { data, error } = await supabase.storage.from(bucket).list(pathPrefix)

    if (error) {
      console.error("Error listing files:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Transform to StoredFile format
    return await Promise.all(
      data.map(async (item) => {
        const filePath = `${pathPrefix}/${item.name}`
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

        return {
          name: item.name,
          size: item.metadata?.size || 0,
          type: item.metadata?.mimetype || "",
          url: urlData.publicUrl,
          path: filePath,
          created_at: item.created_at || new Date().toISOString(),
        }
      }),
    )
  } catch (error) {
    console.error("Error in listUserFiles:", error)
    return []
  }
}

// Delete a user file
export const deleteUserFile = async (userId: string, category: FileCategory, filename: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()
    const bucket = getBucketForCategory(category)
    const pathPrefix = getUserPathPrefix(userId, category)
    const filePath = `${pathPrefix}/${filename}`

    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) {
      console.error("Error deleting file:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteUserFile:", error)
    return false
  }
}

// Update user profile picture
export const updateProfilePicture = async (userId: string, file: File): Promise<string | null> => {
  try {
    // Generate a unique filename with the original extension
    const fileExt = file.name.split(".").pop()
    const filename = `avatar.${fileExt}`

    // Upload the profile picture
    const result = await uploadUserFile(file, userId, "profile", filename)

    if (!result) {
      return null
    }

    // Update the user's profile with the new avatar URL
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("profiles").update({ avatar_url: result.url }).eq("id", userId)

    if (error) {
      console.error("Error updating profile with avatar URL:", error)
      return null
    }

    return result.url
  } catch (error) {
    console.error("Error in updateProfilePicture:", error)
    return null
  }
}

// Get user profile picture URL
export const getProfilePictureUrl = async (userId: string): Promise<string | null> => {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("profiles").select("avatar_url").eq("id", userId).single()

    if (error || !data) {
      return null
    }

    return data.avatar_url
  } catch (error) {
    console.error("Error in getProfilePictureUrl:", error)
    return null
  }
}

