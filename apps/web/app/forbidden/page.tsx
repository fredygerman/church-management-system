import Link from "next/link"

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold">403</h1>
      <h2 className="text-2xl font-semibold">Access Forbidden</h2>
      <p className="max-w-lg text-muted-foreground">
        You are signed in, but your role does not have permission to access this page.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        Go to Home
      </Link>
    </div>
  )
}
