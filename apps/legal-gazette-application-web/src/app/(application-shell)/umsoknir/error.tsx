'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Villa kom upp við að sækja umsókn</h2>
      <p>Vinsamlegast reynið aftur síðar</p>
    </div>
  )
}
