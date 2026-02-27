'use client'

import { useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Problem } from '@dmr.is/ui/components/Problem/Problem'

import { ApplicationAdvert } from '../../lib/trpc/types'
import { AdvertList } from '../adverts/AdvertList'
import { AdvertTable } from '../adverts/AdvertTable'

type Props = {
  adverts?: ApplicationAdvert[]
  applicationId: string
  showToggle?: boolean
}

export const ApplicationAdverts = ({
  applicationId,
  adverts = [],
  showToggle = true,
}: Props) => {
  const [showAsCards, setShowAsCards] = useState(false)

  if (adverts.length === 0) {
    return (
      <Problem
        title="Engar auglýsingar"
        message="Engar auglýsingar fundust fyrir þessa umsókn"
        variant="alert"
        type="no-data"
      />
    )
  }

  return (
    <Stack space={[2, 3, 4]}>
      {showToggle && (
        <Button
          icon={showAsCards ? 'menu' : 'copy'}
          iconType="outline"
          variant="utility"
          onClick={() => setShowAsCards((prev) => !prev)}
        >
          {showAsCards ? 'Sýna sem töflu' : 'Sýna sem spjöld'}
        </Button>
      )}
      {showAsCards ? (
        <AdvertList adverts={adverts} />
      ) : (
        <AdvertTable adverts={adverts} applicationId={applicationId} />
      )}
    </Stack>
  )
}
