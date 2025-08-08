'use client'
export const dynamic = 'force-dynamic'

export default function Error({
  error: _error,
  reset: _reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.log('Error:', _error)

  return (
    <div>
      <h2>Umsóknartegund er ekki til</h2>
      <p>Athugaðu hvort slóðin sé rétt.</p>
    </div>
  )
}
