import { UserFileManager } from "@/components/storage/user-file-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function StoragePage() {
  return (
    <div className="container mx-auto p-4 md:p-6 pt-16 md:pt-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Storage</h1>
        <p className="text-muted-foreground">Upload and manage files for your application</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <UserFileManager />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
            <CardDescription>Monitor your storage usage and limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Images</span>
                  <span className="text-sm">2.4 MB / 500 MB</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[0.5%] rounded-full bg-primary"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Documents</span>
                  <span className="text-sm">15.8 MB / 500 MB</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[3%] rounded-full bg-primary"></div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <h3 className="text-sm font-medium">Storage Tips</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• Images are automatically optimized</li>
                  <li>• Files are stored securely in your Supabase bucket</li>
                  <li>• You can organize files in folders</li>
                  <li>• Set public or private access controls</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

