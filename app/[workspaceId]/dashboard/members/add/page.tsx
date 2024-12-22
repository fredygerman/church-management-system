import { MemberForm } from "@/components/form/MemberForm"

export default function NewMemberPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-center text-3xl font-bold">
        New Member Registration
      </h1>
      <MemberForm />
    </div>
  )
}