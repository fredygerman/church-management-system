import { getChurches } from "@/actions/church"
import { DashboardLayout } from "@/components/layout/dashboard/dashboard-layout"
import { ChurchNotFoundError } from "@/components/church/church-not-found-error"

interface PageProps {
  params: Promise<{
    churchId: string
  }>
}

interface Church {
  id: string
  name: string
  location?: string
  imageUrl?: string
}

export default async function Layout({
  params,
  children,
}: PageProps & { children: React.ReactNode }) {
  const { churchId } = await params

  let churches: Church[] = []
  let currentChurch: Church | null = null

  try {
    churches = await getChurches()
    currentChurch =
      churches.find((church) => church.id === churchId) || null
  } catch (error) {
    // Re-throw Next.js control flow errors (redirect, notFound, etc.)
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    console.error("Error fetching churches:", error)
  }

  if (!currentChurch) {
    return <ChurchNotFoundError churchId={churchId} />
  }

  return (
    <DashboardLayout churches={churches} currentChurch={currentChurch}>
      {children}
    </DashboardLayout>
  )
}
