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
import { useT } from "@/components/i18n/locale-provider"

export function CreateChurchDialog() {
  const { t } = useT()
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
      toast.error(t("final.church.userMissing"))
      return
    }

    if (!name || !location || !leadPastorName) {
      toast.error(t("final.church.fillRequired"))
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
        toast.success(t("final.church.created"))
        router.push(`/${response.id}/dashboard`)
      } else {
        throw new Error(t("final.church.createFailed"))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("final.church.createFailed"))
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
          {t("final.church.createButton")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("final.church.createTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t("final.church.nameLabel")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("final.church.namePlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="location">{t("final.church.locationLabel")}</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("final.church.locationPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="leadPastorName">{t("final.church.pastorLabel")}</Label>
            <Input
              id="leadPastorName"
              value={leadPastorName}
              onChange={(e) => setLeadPastorName(e.target.value)}
              placeholder={t("final.church.pastorPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="email">{t("final.church.emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="church@example.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">{t("final.church.phoneLabel")}</Label>
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
            {isLoading ? t("final.church.creating") : t("final.church.createButton")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
