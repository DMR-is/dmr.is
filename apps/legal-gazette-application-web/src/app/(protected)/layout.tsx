export default async function ProtectedLayout({
  children,
  view,
  header,
}: {
  children: React.ReactNode
  view: React.ReactNode
  header: React.ReactNode
}) {
  return (
    <>
      {header}
      {view}
      {children}
    </>
  )
}
