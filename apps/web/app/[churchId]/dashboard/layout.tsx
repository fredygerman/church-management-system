import { getChurches } from "@/actions/church"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

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
    console.error("Error fetching churches:", error)
  }

  if (!currentChurch) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl text-red-500">Error: Church not found</p>
      </div>
    )
  }

  return (
    <DashboardLayout churches={churches} currentChurch={currentChurch}>
      {children}
    </DashboardLayout>
  )
}
