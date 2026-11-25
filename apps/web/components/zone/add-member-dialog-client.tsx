"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddMemberDialog } from "./add-member-dialog"
import { useT } from "@/components/i18n/locale-provider"

interface AddMemberDialogClientProps {
  zoneId: string
  churchId: string
}

export function AddMemberDialogClient({
  zoneId,
  churchId,
}: AddMemberDialogClientProps) {
  const { t } = useT()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t("sweep.a.addMember")}
      </Button>
      <AddMemberDialog
        open={open}
        onOpenChange={setOpen}
        zoneId={zoneId}
        churchId={churchId}
      />
    </>
  )
}

