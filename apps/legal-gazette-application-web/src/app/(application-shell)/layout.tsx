'use client'

import useSWRMutation from 'swr/mutation'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  LinkV2,
  Text,
  toast,
} from '@island.is/island-ui/core'

import { SubmitBankruptcyApplicationRequest, TypeEnum } from '../../gen/fetch'
import { PageRoutes } from '../../lib/constants'
import { submitBankruptcyApplication } from '../../lib/fetchers'
import * as styles from './application-shell.css'

export default function ApplicationShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { trigger: submitBankruptcyApplicationTrigger } = useSWRMutation(
    'submitBankruptcyApplication',
    (_key: string, { arg }: { arg: SubmitBankruptcyApplicationRequest }) =>
      submitBankruptcyApplication(arg),
    {
      onSuccess: () => {
        toast.success('Umsókn hefur verið send til birtingar.', {
          toastId: 'submit-bankruptcy-application-success',
        })
      },
      onError: () => {
        toast.error(
          'Ekki tókst að senda inn umsókn. Vinsamlegast reyndu aftur síðar.',
          {
            toastId: 'submit-bankruptcy-application-error',
          },
        )
      },
    },
  )

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget as HTMLFormElement)

    const applicationType = formData.get('application-type')

    switch (applicationType) {
      case TypeEnum.InnköllunÞrotabús: {
        const applicationId = formData.get('application-id') as string
        const caseId = formData.get('case-id') as string

        submitBankruptcyApplicationTrigger({
          applicationId,
          caseId,
        })

        break
      }
      case TypeEnum.InnköllunDánarbús:
        toast.error(
          'Ekki er hægt að senda inn umsókn af þessari gerð. Vinsamlegega reyndu aftur síðar.',
        )
        break
      default:
        toast.error(
          'Ekki er hægt að senda inn umsókn af þessari gerð. Vinsamlegega reyndu aftur síðar.',
        )
        return
    }
  }

  return (
    <Box
      component="form"
      background="purple100"
      paddingY={6}
      className={styles.shellWrapper}
      onSubmit={handleSubmit}
    >
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '9/12']}>
            <Box
              className={styles.shellContent}
              paddingTop={[7, 9]}
              paddingBottom={[4, 6]}
              paddingX={[9, 12]}
              background="white"
            >
              {children}
            </Box>
            <Box
              paddingY={[3, 5]}
              paddingX={[9, 12]}
              background="white"
              borderTopWidth="standard"
              borderColor="purple100"
              className={styles.shellFooter}
            >
              <Inline justifyContent="spaceBetween" alignY="center">
                <LinkV2 href={PageRoutes.APPLICATIONS}>
                  <Button preTextIcon="arrowBack" variant="ghost">
                    Yfirlit
                  </Button>
                </LinkV2>
                <Button type="submit" icon="arrowForward">
                  Senda til birtingar
                </Button>
              </Inline>
            </Box>
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '3/12']}>
            <Box paddingY={[2, 4]}>
              <Text variant="h4">Texti hér</Text>
            </Box>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
