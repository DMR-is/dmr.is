export default async function RitstjornLayout({
  children,
}: {
  children: React.ReactNode
  createModal: React.ReactNode
}) {
  return (
    <>
      {children}
      {createModal}
    </>
  )
}
