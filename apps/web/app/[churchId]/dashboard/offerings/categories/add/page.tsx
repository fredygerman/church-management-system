import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ensurePermission } from "@/lib/permissions-server"
import { OfferingCategoryForm } from "@/components/form/OfferingCategoryForm"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function OfferingCategoryAddPage({ params }: PageProps) {
  await ensurePermission("manage:offerings")
  const { churchId } = await params

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/offerings/categories`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Offering Category</h1>
          <p className="text-gray-600">Add a new giving category for your church</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <OfferingCategoryForm churchId={churchId} />
      </div>
    </div>
  )
}
