'use client'

export default function Error({
  error: _error,
  reset: _reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Villa kom upp</h2>
    </div>
  )
}
