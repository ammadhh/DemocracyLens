import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 pt-16 md:pt-6">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-muted-foreground">Welcome back to Democracy News Lens</p>
      </div>
      <LoginForm />
    </div>
  )
}

