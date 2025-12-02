'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'

import { useEffect, useState } from 'react'

import { identityServerId } from '@dmr.is/auth/identityProvider'
import { Header } from '@dmr.is/ui/components/Header/Header'
import { HeaderLogin } from '@dmr.is/ui/components/Header/HeaderLogin'
import {
  AlertMessage,
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

type MigrationStatus = 'loading' | 'success' | 'error' | 'no-token'

export default function MigrationCompletionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status: sessionStatus } = useSession()
  const token = searchParams.get('token')
  const trpc = useTRPC()

  const [migrationStatus, setMigrationStatus] =
    useState<MigrationStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const completeMigration = useMutation(
    trpc.completeMigration.mutationOptions(),
  )

  useEffect(() => {
    if (!token) {
      setMigrationStatus('no-token')
      return
    }

    // Wait for session to load
    if (sessionStatus === 'loading') {
      return
    }

    // User must be authenticated
    if (!session) {
      setMigrationStatus('error')
      setErrorMessage(
        'Þú þarft að vera innskráð/ur til að ljúka flutningi áskriftar.',
      )
      return
    }

    // Only attempt migration once
    if (completeMigration.isPending || completeMigration.isSuccess) {
      return
    }

    completeMigration.mutate(
      { token },
      {
        onSuccess: () => {
          setMigrationStatus('success')
        },
        onError: (error) => {
          setMigrationStatus('error')
          const message =
            error instanceof Error ? error.message : 'Óþekkt villa kom upp'

          // Map common error messages to Icelandic
          if (message.includes('Token not found or expired')) {
            setErrorMessage(
              'Hlekkurinn er útrunninn eða ógildur. Vinsamlegast óskið eftir nýjum hlekk.',
            )
          } else if (message.includes('already been used')) {
            setErrorMessage('Þessi hlekkur hefur þegar verið notaður.')
          } else if (message.includes('does not match')) {
            setErrorMessage(
              'Þú þarft að vera innskráð/ur með sömu kennitölu og þú notaðir þegar þú baðst um flutning.',
            )
          } else if (message.includes('already migrated')) {
            setErrorMessage(
              'Þessi reikningur hefur þegar verið fluttur í nýja kerfið.',
            )
          } else {
            setErrorMessage(message)
          }
        },
      },
    )
  }, [])

  const handleGoHome = () => {
    router.push('/')
  }

  const handleTryAgain = () => {
    router.push('/skraning')
  }

  // Show loading header while determining session status
  const HeaderComponent = session ? Header : HeaderLogin

  return (
    <>
      <HeaderComponent />
      <GridContainer>
        <GridRow marginTop={[4, 6, 8]}>
          <GridColumn
            span={['12/12', '8/12', '6/12']}
            offset={['0', '2/12', '3/12']}
          >
            <Box
              background="white"
              padding={[3, 4, 6]}
              borderRadius="large"
              boxShadow="subtle"
            >
              {migrationStatus === 'loading' && (
                <Stack space={3} align="center">
                  <Text variant="h2" as="h1">
                    Flyt áskrift...
                  </Text>
                  <Text>
                    Vinsamlegast bíðið á meðan áskriftin þín er flutt í nýja
                    kerfið.
                  </Text>
                </Stack>
              )}

              {migrationStatus === 'no-token' && (
                <Stack space={3}>
                  <AlertMessage
                    type="warning"
                    title="Enginn flutningshlekkur"
                    message="Þessi síða krefst gildis flutningshlekkjar. Vinsamlegast notið hlekkinn úr tölvupóstinum sem þið fenguð."
                  />
                  <Box display="flex" justifyContent="center">
                    <Button variant="primary" onClick={handleTryAgain}>
                      Fara á skráningarsíðu
                    </Button>
                  </Box>
                </Stack>
              )}

              {migrationStatus === 'success' && (
                <Stack space={3}>
                  <AlertMessage
                    type="success"
                    title="Flutningur tókst!"
                    message="Áskriftin þín hefur verið flutt í nýja kerfið. Þú getur nú notað Lögbirtingablaðið með rafrænum skilríkjum."
                  />
                  <Box display="flex" justifyContent="center">
                    <Button
                      variant="primary"
                      icon="arrowForward"
                      iconType="outline"
                      onClick={handleGoHome}
                    >
                      Fara á forsíðu
                    </Button>
                  </Box>
                </Stack>
              )}

              {migrationStatus === 'error' && (
                <Stack space={3}>
                  <AlertMessage
                    type="error"
                    title="Villa við flutning"
                    message={errorMessage}
                  />
                  <Stack space={2}>
                    <Text>
                      Ef þú heldur áfram að lenda í vandræðum, vinsamlegast
                      hafðu samband við þjónustuver.
                    </Text>
                  </Stack>
                  <Box display="flex" justifyContent="center">
                    <Button variant="ghost" onClick={handleTryAgain}>
                      Reyna aftur
                    </Button>
                  </Box>
                </Stack>
              )}
            </Box>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </>
  )
}
