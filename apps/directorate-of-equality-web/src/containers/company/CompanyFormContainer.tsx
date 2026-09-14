'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Breadcrumbs } from '@dmr.is/ui/components/island-is/Breadcrumbs'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { AlertMessage } from '@island.is/island-ui/core'

import { CompanyConfirmationModal } from '../../components/company/CompanyConfirmationModal'
import { CompanyObligationTags } from '../../components/company/CompanyObligationTags'
import { CompanyDto } from '../../gen/fetch'
import { NAV_PATHS } from '../../lib/constants'
import { companiesText, headerText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { CompanyTabsContainer } from './CompanyTabsContainer'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = companiesText.detailView

type CompanyFormContainerProps = {
  company: CompanyDto
}

type CompanyConfirmationModalType = 'fines' | 'quarantine'

const confirmationModalText = {
  fines: companiesText.dailyFinesModal,
  quarantine: companiesText.quarantineModal,
}

export function CompanyFormContainer({ company }: CompanyFormContainerProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [confirmationType, setConfirmationType] =
    useState<CompanyConfirmationModalType>()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const invalidateCompany = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.company.get.queryKey({ id: company.id }),
    })
    queryClient.invalidateQueries({
      queryKey: trpc.company.getTimeline.queryKey({ id: company.id }),
    })
  }

  const updateFines = useMutation({
    ...trpc.company.updateFines.mutationOptions(),
    onSuccess: (_, variables) => {
      invalidateCompany()

      toast.success(
        variables.finesStarted ? t.finesStartedToast : t.finesStoppedToast,
      )
    },
    onError: () => toast.error(t.finesErrorToast),
  })

  const updateQuarantine = useMutation({
    ...trpc.company.updateQuarantine.mutationOptions(),
    onSuccess: (_, variables) => {
      invalidateCompany()
      toast.success(
        variables.quarantined ? t.quarantinedToast : t.unquarantinedToast,
      )
    },
    onError: () => toast.error(t.quarantineErrorToast),
  })

  return (
    <Box
      background="white"
      paddingX={[4, 4, 4, 8, 14]}
      paddingY={[4, 4, 4, 8]}
      borderRadius="large"
    >
      <Stack space={[2]}>
        <Breadcrumbs
          items={[
            { title: headerText.brand, href: NAV_PATHS.frontpage.href },
            {
              title: NAV_PATHS.fyrirtaeki.title,
              href: NAV_PATHS.fyrirtaeki.href,
            },
          ]}
        />
        <Stack space={1}>
          <Box
            display="flex"
            justifyContent="spaceBetween"
            alignItems="center"
            marginBottom={2}
          >
            <Text variant="h3">{company.name}</Text>
            <Box>
              <CompanyObligationTags company={company} />
            </Box>
          </Box>
          {company.quarantined && (
            <Box marginBottom={4}>
              <AlertMessage type="warning" title={t.quarantinedAlert} />
              <Box marginTop={1}>
                <Button
                  size="small"
                  variant="text"
                  colorScheme="destructive"
                  icon="close"
                  iconType="outline"
                  loading={updateQuarantine.isPending}
                  onClick={() =>
                    updateQuarantine.mutate({
                      id: company.id,
                      quarantined: false,
                    })
                  }
                >
                  {t.quarantineStopButton}
                </Button>
              </Box>
            </Box>
          )}
          {company.finesStarted && (
            <Box marginBottom={4}>
              <AlertMessage type="warning" title={t.finesAlert} />
              <Box marginTop={1}>
                <Button
                  size="small"
                  variant="text"
                  colorScheme="destructive"
                  icon="close"
                  iconType="outline"
                  loading={updateFines.isPending}
                  onClick={() =>
                    updateFines.mutate({ id: company.id, finesStarted: false })
                  }
                >
                  {t.finesStopButton}
                </Button>
              </Box>
            </Box>
          )}
          {(!company.finesStarted || !company.quarantined) && (
            <Box marginBottom={4} display="flex" columnGap={2}>
              {!company.finesStarted && (
                <Button
                  size="small"
                  variant="text"
                  colorScheme="destructive"
                  icon="gavel"
                  iconType="outline"
                  loading={updateFines.isPending}
                  onClick={() => {
                    setConfirmationType('fines')
                    setIsModalOpen(true)
                  }}
                >
                  {t.finesButton}
                </Button>
              )}
              {!company.quarantined && (
                <Button
                  size="small"
                  variant="text"
                  colorScheme="destructive"
                  icon="lockClosed"
                  iconType="outline"
                  loading={updateQuarantine.isPending}
                  onClick={() => {
                    setConfirmationType('quarantine')
                    setIsModalOpen(true)
                  }}
                >
                  {t.quarantineButton}
                </Button>
              )}
            </Box>
          )}
        </Stack>
      </Stack>
      <CompanyTabsContainer company={company} />
      <CompanyConfirmationModal
        text={
          confirmationType && {
            title: confirmationModalText[confirmationType].title,
            description: confirmationModalText[confirmationType].description(
              <Text key="company-name" as="span" fontWeight="semiBold">
                {company.name}
              </Text>,
            ),
            confirmButton:
              confirmationModalText[confirmationType].confirmButton,
          }
        }
        visible={isModalOpen}
        isLoading={updateQuarantine.isPending || updateFines.isPending}
        onClose={() => setIsModalOpen(false)}
        onSubmit={() => {
          if (!confirmationType) return
          // Close once the request settles so the confirm button can show its
          // pending state instead of the modal vanishing on click.
          const closeOnSettled = { onSettled: () => setIsModalOpen(false) }
          if (confirmationType === 'fines') {
            updateFines.mutate(
              { id: company.id, finesStarted: true },
              closeOnSettled,
            )
          } else {
            updateQuarantine.mutate(
              { id: company.id, quarantined: true },
              closeOnSettled,
            )
          }
        }}
      />
    </Box>
  )
}
