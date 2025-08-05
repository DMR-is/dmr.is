'use client'
import useSWRMutation from 'swr/mutation'

import { Button, Inline, LinkV2, toast } from '@island.is/island-ui/core'

import { SubmitBankruptcyApplicationRequest } from '../../../../gen/fetch'
import { PageRoutes } from '../../../../lib/constants'
import { submitBankruptcyApplication } from '../../../../lib/fetchers'

export const BankruptcyFooter = () => {
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

  return (
    <Inline justifyContent="spaceBetween" alignY="center">
      <LinkV2 href={PageRoutes.APPLICATIONS}>
        <Button preTextIcon="arrowBack" variant="ghost">
          Yfirlit
        </Button>
      </LinkV2>
      <Button
        onClick={() =>
          submitBankruptcyApplicationTrigger({
            applicationId: '123',
            caseId: '123',
          })
        }
        icon="arrowForward"
      >
        Senda til birtingar
      </Button>
    </Inline>
  )
}
