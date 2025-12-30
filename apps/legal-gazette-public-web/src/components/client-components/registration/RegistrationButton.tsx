'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { Button, toast } from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

export const RegistrationButton = () => {
  const { update } = useSession()

  const router = useRouter()
  const trpc = useTRPC()

  const { mutate: createRegistration, isPending } = useMutation(
    trpc.createSubscription.mutationOptions({
      onSuccess: async (data) => {
        if (data?.success === false) {
          toast.error('Villa kom upp við skráningu, vinsamlegast hafið samband við þjónustuver')
        }
        await update()
        router.refresh()
      },
    }),
  )
  return (
    <Button
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
