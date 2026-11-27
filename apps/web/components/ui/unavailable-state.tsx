interface UnavailableStateProps {
  title: string
  message: string
}

export function UnavailableState({ title, message }: UnavailableStateProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

/** Inline error for a form that still renders; use above the form, not in place of it. */
export function UnavailableNotice({ title, message }: UnavailableStateProps) {
  return (
    <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
      <p className="font-medium">{title}</p>
      <p>{message}</p>
    </div>
  )
}
