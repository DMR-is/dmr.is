export default async function RitstjornLayout({
  children,
  createModal,
}: {
  children: React.ReactNode
  createModal: React.ReactNode
}) {
  return (
    <>
      {children}
      {createModal}
      <div id="modal-root" />
    </>
  )
}
