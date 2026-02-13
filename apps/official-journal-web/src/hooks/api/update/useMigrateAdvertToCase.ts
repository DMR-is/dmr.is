import { useSession } from 'next-auth/react'

import { useState } from 'react'

import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { getDmrClient } from '../../../lib/api/createClient'
type AdvertToCaseParams = {
  advertId: string
}

export const useMigrateAdvertToCase = () => {
  const [loading, setLoading] = useState(false)

  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const migrateAdvertToCase = async ({ advertId }: AdvertToCaseParams) => {
    setLoading(true)

    try {
      await dmrClient.createCaseFromAdvert({
        advertId,
      })

      toast.success('Mál hefur verið stofnað út frá auglýsingu', {
        toastId: 'migrateAdvertToCase',
      })
    } catch (error) {
      toast.error('Ekki tókst að stofna mál út frá auglýsingu', {
        toastId: 'migrateAdvertToCase',
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    migrateAdvertToCase,
  }
}
