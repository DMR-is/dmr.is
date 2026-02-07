'use client'

import { useSession } from 'next-auth/react'

import { useState } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { RegistrationButton } from '../../../components/client-components/registration/RegistrationButton'
import * as styles from '../skraning.css'

export default function Signup() {
  const { data: session } = useSession()

  // New subscription form state
  const [termsApproved, setTermsApproved] = useState(false)

  return (
    <GridContainer className={styles.contentContainer}>
      <GridRow marginTop={[2, 2, 3]}>
        <GridColumn
          paddingBottom={[2, 2, 3]}
          offset={['0', '0', '0', '0', '1/12']}
          span={['10/12', '5/12', '5/12', '5/12', '5/12']}
        >
          <Box component="img" src="/images/image-with-text-1.svg" />
        </GridColumn>
        <GridColumn
          paddingTop={[0, 4, 6, 8, 12]}
          span={['12/12', '7/12', '7/12', '6/12', '5/12']}
        >
          <Stack space={4}>
            <Stack space={2}>
              <Text variant="h2">Gerast áskrifandi</Text>
              <Text variant="intro">
                Velkomin á skráningarvef fyrir rafræna áskrift
                Lögbirtingablaðsins
              </Text>
              <Text>
                Við skráninguna verður til greiðsluseðill að fjárhæð 4.500 kr.
                sem er ársáskriftargjald sem greitt er fyrirfram. Það opnast
                fyrir aðgang að kerfinu í eitt ár daginn sem að þú skráir þig.
              </Text>
            </Stack>

            {session?.user.isActive ? (
              <>
                <AlertMessage type="info" title="Þú ert með virka áskrift" />
                <LinkV2 href="/">
                  <Button preTextIcon="arrowBack" variant="text">
                    Fara á forsíðu
                  </Button>
                </LinkV2>
              </>
            ) : (
              <form>
                <Stack space={[2, 3]}>
                  <Input
                    name="name"
                    type="text"
                    label="Nafn"
                    backgroundColor="blue"
                    readOnly
                    value={session?.user.name ?? ''}
                    required
                  />
                  <Input
                    name="kennitala"
                    type="text"
                    label="Kennitala"
                    backgroundColor="blue"
                    readOnly
                    value={session?.user?.nationalId ?? ''}
                    required
                  />
                  <Checkbox
                    name={`approve-terms`}
                    onChange={(e) => setTermsApproved(e.target.checked)}
                    checked={termsApproved}
                    label="Ég samþykki að greiðsluseðill verði sendur í heimabanka"
                    labelVariant="small"
                  />
                  <Inline space={2} justifyContent="flexEnd">
                    <RegistrationButton disabled={!termsApproved} />
                  </Inline>
                </Stack>
              </form>
            )}
          </Stack>
        </GridColumn>
      </GridRow>

      {/* New Subscription Form */}
    </GridContainer>
  )
}
