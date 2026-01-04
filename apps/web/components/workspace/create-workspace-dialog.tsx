"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createWorkspace } from "@/actions/workspace"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function CreateWorkspaceDialog() {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const router = useRouter()
  const { data: session } = useSession()

  const handleCreate = async () => {
    const { customUser } = session?.user as any

    if (!session?.user) {
      toast.error("User not authenticated")
      return
    }

    const newWorkspace = {
      name,
      location,
      imageUrl,
      createdBy: customUser.id,
      updatedBy: customUser.id,
    }

    toast.promise(
      (async () => {
        const response = await createWorkspace(newWorkspace)
        if (response) {
          router.push(`/${response[0].id}/settings`)
          return "Workspace created successfully 🎉"
        } else {
          throw new Error("Failed to create workspace 😢")
        }
      })(),
      {
        loading: "Please wait, Creating workspace...",
        success: "Workspace created successfully 🎉",
        error: (error) => `${error}`,
      }
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="bg-blue-600 text-background hover:bg-blue-700 hover:text-background"
        >
          Create Workspace
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700"
            >
              Location
            </label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm font-medium text-gray-700"
            >
              Image URL
            </label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
