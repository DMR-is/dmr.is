'use client'

import { useSession } from 'next-auth/react'

import { useState } from 'react'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Input,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

export default function Signup() {
  const { data: session } = useSession()

  // New subscription form state
  const [createState, setCreateState] = useState<{
    name: string
    nationalId: string
    email: string
  }>({
    name: '',
    nationalId: '',
    email: '',
  })

  return (
    <GridContainer>
      <GridRow marginTop={[2, 2, 3]}>
        <GridColumn
          paddingBottom={[2, 2, 3]}
          offset={['0', '1/12']}
          span={['12/12', '5/12']}
        >
          <Box component="img" src="/images/image-with-text-1.svg" />
        </GridColumn>
        <GridColumn paddingBottom={[2, 2, 3]} span={['12/12', '5/12']}>
          <Box
            display="flex"
            flexDirection="column"
            height="full"
            justifyContent="center"
          >
            <Stack space={2}>
              <Text variant="h2">Gerast áskrifandi</Text>
              <Text variant="intro">
                Velkomin á skráningarvef fyrir rafræna áskrift Lögbirtingablaðs
              </Text>
              <Text>
                Við skráninguna verður til greiðsluseðill að fjárhæð 4.500 kr.
                sem er ársáskriftargjald sem greitt er fyrirfram. Það opnast
                fyrir aðgang að kerfinu í eitt ár daginn eftir að sú upphæð
                hefur verið greidd.
              </Text>
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>

      {/* New Subscription Form */}
      <form>
        <GridRow rowGap={[2, 3]} marginBottom={[4, 8]}>
          <GridColumn span={['12/12', '5/12']} offset={['0', '6/12']}>
            <Stack space={[2, 4]}>
              <Input
                name="name"
                type="text"
                label="Nafn"
                placeholder="Sláðu inn nafn"
                backgroundColor="blue"
                value={session?.user.name ?? createState.name}
                onChange={(e) =>
                  setCreateState({
                    ...createState,
                    name: e.target.value,
                  })
                }
                required
              />
              <Input
                name="kennitala"
                type="text"
                label="Kennitala"
                placeholder="Sláðu inn kennitölu"
                backgroundColor="blue"
                value={session?.user?.nationalId ?? createState.nationalId}
                onChange={(e) =>
                  setCreateState({
                    ...createState,
                    nationalId: e.target.value,
                  })
                }
                required
              />
              <Input
                name="netfang"
                type="text"
                label="Netfang"
                placeholder="Sláðu inn netfang"
                backgroundColor="blue"
                value={createState.email}
                onChange={(e) =>
                  setCreateState({
                    ...createState,
                    email: e.target.value,
                  })
                }
                required
              />
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
            <Inline space={2} justifyContent="flexEnd">
              <Button
                icon="arrowForward"
                iconType="outline"
                // loading={isCreatingInstitution}

                variant="primary"
                // onClick={() => createInstitution(createState)}
              >
                Vista
              </Button>
            </Inline>
          </GridColumn>
        </GridRow>
      </form>
    </GridContainer>
  )
}
