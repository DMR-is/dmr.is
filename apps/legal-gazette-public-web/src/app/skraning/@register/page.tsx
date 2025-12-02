'use client'

import { useSession } from 'next-auth/react'

import { useState } from 'react'

import {
  AlertMessage,
  Box,
  Button,
  Divider,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Input,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

type LegacyMigrationState = 'idle' | 'checking' | 'sending' | 'sent' | 'error'

export default function Signup() {
  const { data: session } = useSession()
  const trpc = useTRPC()

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

  // Legacy migration state
  const [legacyEmail, setLegacyEmail] = useState('')
  const [legacyMigrationState, setLegacyMigrationState] =
    useState<LegacyMigrationState>('idle')
  const [legacyError, setLegacyError] = useState('')

  // Mutations for legacy migration
  const checkEmail = useMutation(trpc.checkEmail.mutationOptions())
  const requestMigration = useMutation(trpc.requestMigration.mutationOptions())

  const handleLegacyMigrationRequest = async () => {
    if (!legacyEmail.trim()) {
      setLegacyError('Vinsamlegast sláðu inn netfang')
      setLegacyMigrationState('error')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(legacyEmail)) {
      setLegacyError('Vinsamlegast sláðu inn gilt netfang')
      setLegacyMigrationState('error')
      return
    }

    setLegacyMigrationState('checking')
    setLegacyError('')

    try {
      // First check if the email exists in legacy system
      const result = await checkEmail.mutateAsync({ email: legacyEmail })

      if (!result._exists) {
        setLegacyError(
          'Þetta netfang fannst ekki í eldra kerfinu. Vinsamlegast athugaðu hvort netfangið sé rétt eða skráðu nýja áskrift.',
        )
        setLegacyMigrationState('error')
        return
      }

      // If user already has kennitala in legacy system, they should auto-migrate
      if (result.hasKennitala) {
        setLegacyError(
          'Þessi reikningur er þegar tengdur við kennitölu og ætti að flytjast sjálfkrafa við innskráningu. Ef það virkaði ekki, vinsamlegast hafðu samband við þjónustuver.',
        )
        setLegacyMigrationState('error')
        return
      }

      // Send magic link
      setLegacyMigrationState('sending')
      await requestMigration.mutateAsync({ email: legacyEmail })

      setLegacyMigrationState('sent')
    } catch (error) {
      setLegacyMigrationState('error')
      if (error instanceof Error) {
        setLegacyError(error.message)
      } else {
        setLegacyError('Óþekkt villa kom upp. Vinsamlegast reynið aftur síðar.')
      }
    }
  }

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
                Við skráninguna verður til greiðsluseðill að fjárhæð 3.000 kr.
                sem er ársáskriftargjald sem greitt er fyrirfram. Það opnast
                fyrir aðgang að kerfinu í eitt ár daginn eftir að sú upphæð
                hefur verið greidd.
              </Text>
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>

      {/* Legacy Migration Section */}
      <GridRow marginTop={[2, 3]} marginBottom={[2, 3]}>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Box
            background="blue100"
            padding={[3, 4]}
            borderRadius="large"
            borderColor="blue200"
            borderWidth="standard"
            borderStyle="solid"
          >
            <Stack space={3}>
              <Text variant="h3">Ertu þegar áskrifandi?</Text>
              <Text>
                Ef þú átt áskrift í eldra kerfi Lögbirtingablaðsins geturðu
                flutt hana hingað. Sláðu inn netfangið sem þú notaðir í eldra
                kerfinu og við sendum þér staðfestingarpóst.
              </Text>

              {legacyMigrationState === 'sent' ? (
                <AlertMessage
                  type="success"
                  title="Staðfestingarpóstur sendur!"
                  message={`Við höfum sent tölvupóst á ${legacyEmail} með hlekk til að ljúka flutningi áskriftarinnar. Athugaðu einnig ruslpóstmöppuna ef þú finnur ekki póstinn.`}
                />
              ) : (
                <Stack space={2}>
                  <Input
                    name="legacy-email"
                    type="email"
                    label="Netfang í eldra kerfi"
                    placeholder="netfang@daemi.is"
                    backgroundColor="white"
                    value={legacyEmail}
                    onChange={(e) => {
                      setLegacyEmail(e.target.value)
                      if (legacyMigrationState === 'error') {
                        setLegacyMigrationState('idle')
                        setLegacyError('')
                      }
                    }}
                    hasError={legacyMigrationState === 'error'}
                    errorMessage={legacyError}
                  />
                  <Box>
                    <Button
                      variant="ghost"
                      size="small"
                      icon="mail"
                      iconType="outline"
                      loading={
                        legacyMigrationState === 'checking' ||
                        legacyMigrationState === 'sending'
                      }
                      onClick={handleLegacyMigrationRequest}
                    >
                      Senda staðfestingarpóst
                    </Button>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>

      {/* Divider */}
      <GridRow marginBottom={[2, 3]}>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Divider />
          <Box marginTop={[2, 3]}>
            <Text variant="h3">Ný áskrift</Text>
            <Text marginTop={1}>
              Ef þú ert ekki áskrifandi í eldra kerfinu, vinsamlegast fylltu út
              formið hér að neðan til að skrá nýja áskrift.
            </Text>
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
