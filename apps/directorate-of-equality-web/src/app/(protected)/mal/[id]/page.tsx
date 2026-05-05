export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <div>Mál: {id}</div>
}
