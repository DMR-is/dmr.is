import { useSession } from 'next-auth/react'

import { useState } from 'react'

import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { getDmrClient } from '../../../lib/api/createClient'
type PostAdvertRegulation = {
  advertId: string
}

export const usePublishAdvertRegulation = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const publishRegulation = async ({ advertId }: PostAdvertRegulation) => {
    setLoading(true)
    setError(null)

    try {
      await dmrClient
        .publishSingleRegulation({
          id: advertId,
        })
        .then(() => {
          toast.success('Reglugerð send í ritstjórnarkerfi reglugerða', {
            toastId: 'publishRegulation',
          })
          setLoading(false)
        })
        .catch((error) => {
          setError(
            `Ekki tókst að senda reglugerð í ritstjórnarkerfi reglugerða`,
          )
          setLoading(false)
          toast.error(
            'Ekki tókst að senda reglugerð í ritstjórnarkerfi reglugerða',
            {
              toastId: 'publishRegulation',
            },
          )
        })
    } catch (error) {
      setError(`Ekki tókst að senda reglugerð í ritstjórnarkerfi reglugerða`)
      setLoading(false)
    }
  }

  return {
    loading,
    publishRegulation,
  }
}
