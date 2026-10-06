'use client'

import { useSearchParams } from 'next/navigation'

import { Suspense } from 'react'

import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

function ErrorContent() {
  const error = useSearchParams().get('error')

  return (
    <GridContainer>
      <GridRow marginTop={[2, 2, 3]}>
        <GridColumn paddingBottom={[2, 2, 3]} span={['12/12', '6/12']}>
          <Stack space={2}>
            <Text variant="h2">Villa við innskráningu</Text>
            <Text>
              {error === 'AccessDenied'
                ? 'Þú hefur ekki aðgang að þessu kerfi.'
                : 'Eitthvað fór úrskeiðis við innskráningu. Vinsamlegast reyndu aftur.'}
            </Text>
            <LinkV2 href="/innskraning" underline="normal" color="blue400">
              Til baka á innskráningu
            </LinkV2>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

// NextAuth sends sign-in failures here (pages.error in authOptions)
export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  )
}
