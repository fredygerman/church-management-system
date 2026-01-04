import Image from "next/image"
import Link from "next/link"
import { type workspaces } from "@/db/schema"
import { ArrowRight, CheckCircle, MapPin, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface WorkspaceCardProps {
  workspace: typeof workspaces.$inferSelect
  totalMembers: number
  className?: string
}

export function WorkspaceCard({
  workspace,
  totalMembers,
  className,
}: WorkspaceCardProps) {
  return (
    <div className={className}>
      <Card className="overflow-hidden">
        <CardHeader className="relative h-48">
          <Image
            src={
              workspace.imageUrl ||
              "https://images.unsplash.com/photo-1519491050282-cf00c82424b4"
            }
            alt={workspace.name}
            className="absolute inset-0 size-full object-cover"
            width={250}
            height={150}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-x-4 bottom-4">
            <CardTitle className="text-2xl font-bold text-white">
              {workspace.name}
            </CardTitle>
            <CardDescription className="flex items-center text-white/80">
              <MapPin className="mr-1 size-4" />
              {workspace.location}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {totalMembers.toLocaleString()} members
              </span>
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
              <CheckCircle className="size-4" />
              <span>Active</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between p-4">
          <div className="text-sm text-muted-foreground">
            ID: {workspace.id}
          </div>
          <Link href={`/${workspace.id}/dashboard/members`}>
            <Button>
              Open
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
