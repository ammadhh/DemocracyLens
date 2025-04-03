import { UserProfile } from "@/components/auth/user-profile"
import { ProfileSettings } from "@/components/auth/profile-settings"
import { ReadingHistory } from "@/components/reading-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilePage() {
  return (
    <div className="container mx-auto p-4 md:p-6 pt-16 md:pt-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account and view your reading history</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4">
          <UserProfile />
        </div>
        <div className="md:col-span-8">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">Reading History</TabsTrigger>
              <TabsTrigger value="settings">Profile Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="mt-4">
              <ReadingHistory />
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <ProfileSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

