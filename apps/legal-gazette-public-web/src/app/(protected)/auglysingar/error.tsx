'use client'
import { ProblemFromError } from '@dmr.is/ui/components/Problem/ProblemFromError'

export default function Error({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {

  return <ProblemFromError variant='bordered' titleSize='h1' error={error} />
}
