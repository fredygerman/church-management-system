import HomeHeader from "@/components/layout/home-header"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <div className="flex flex-1 flex-col">
        <HomeHeader />
        <main>{children}</main>
      </div>
  )
}
