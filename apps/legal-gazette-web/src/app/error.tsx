'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.log(error)
  }, [error])

  return (
    <div>
      <h2>Eitthvað fór úrskeiðis!</h2>
      <button onClick={() => reset()}>Reyna aftur</button>
    </div>
  )
}
