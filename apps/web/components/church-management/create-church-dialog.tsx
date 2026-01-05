"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createChurch } from "@/actions/church"
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
import { Label } from "@/components/ui/label"

export function CreateChurchDialog() {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [leadPastorName, setLeadPastorName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const handleCreate = async () => {
    if (!session?.user) {
      toast.error("User not authenticated")
      return
    }

    if (!name || !location || !leadPastorName) {
      toast.error("Please fill in required fields")
      return
    }

    setIsLoading(true)
    try {
      const response = await createChurch({
        name,
        location,
        leadPastorName,
        phone: phone || undefined,
        email: email || undefined,
      })
      
      if (response && response.id) {
        toast.success("Church created successfully 🎉")
        router.push(`/${response.id}/dashboard`)
      } else {
        throw new Error("Failed to create church")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create church")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="bg-blue-600 text-background hover:bg-blue-700 hover:text-background"
        >
          Create Church
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Church</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Church Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mito Ya Baraka Church"
            />
          </div>
          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Nairobi, Kenya"
            />
          </div>
          <div>
            <Label htmlFor="leadPastorName">Lead Pastor Name *</Label>
            <Input
              id="leadPastorName"
              value={leadPastorName}
              onChange={(e) => setLeadPastorName(e.target.value)}
              placeholder="e.g., Rev. John Doe"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="church@example.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 700 000 000"
            />
          </div>
          <Button 
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Creating..." : "Create Church"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
