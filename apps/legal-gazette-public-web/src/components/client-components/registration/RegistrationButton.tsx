'use client'

import { useSession } from 'next-auth/react'

import { Button, toast } from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

export const RegistrationButton = ({ disabled }: { disabled?: boolean }) => {
  const { update } = useSession()

  const trpc = useTRPC()

  const { mutate: createRegistration, isPending } = useMutation(
    trpc.createSubscription.mutationOptions({
      onSuccess: async (data) => {
        if (data?.success === false) {
          toast.error('Villa kom upp við skráningu, vinsamlegast hafið samband við þjónustuver')
        }
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
