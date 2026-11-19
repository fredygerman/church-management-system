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
