'use client'

import { useSession } from 'next-auth/react'

import { Button } from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

export const RegistrationButton = ({ disabled }: { disabled?: boolean }) => {
  const { update } = useSession()

  const trpc = useTRPC()

  const { mutate: createRegistration, isPending } = useMutation(
    trpc.createSubscription.mutationOptions({
      onSuccess: async () => {
        await update()
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      },
    }),
  )
  return (
    <Button
      disabled={disabled}
      icon="arrowForward"
      iconType="outline"
      variant="primary"
      onClick={() => createRegistration()}
      loading={isPending}
    >
      Gerast áskrifandi
    </Button>
  )
}
