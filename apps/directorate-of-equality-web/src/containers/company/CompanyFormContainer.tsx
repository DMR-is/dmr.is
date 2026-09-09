'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Breadcrumbs } from '@dmr.is/ui/components/island-is/Breadcrumbs'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { AlertMessage } from '@island.is/island-ui/core'

import {
  REPORT_STATUS_LABEL,
  REPORT_STATUS_TAG_VARIANT,
} from '../../components/companies/companyStatus'
import { SendCompanyEmailModal } from '../../components/companies/SendCompanyEmailModal'
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

export function CompanyFormContainer({ company }: CompanyFormContainerProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [isEmailOpen, setIsEmailOpen] = useState(false)

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
              <Tag
                variant={REPORT_STATUS_TAG_VARIANT[company.reportStatus]}
                disabled
                outlined
              >
                {REPORT_STATUS_LABEL[company.reportStatus]}
              </Tag>
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
          <Box marginBottom={4} display="flex" columnGap={2}>
            <Button
              size="small"
              variant="text"
              icon="mail"
              iconType="outline"
              onClick={() => setIsEmailOpen(true)}
            >
              {companiesText.sendEmail.detailButton}
            </Button>
          </Box>
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
                  onClick={() =>
                    updateFines.mutate({ id: company.id, finesStarted: true })
                  }
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
                  onClick={() =>
                    updateQuarantine.mutate({
                      id: company.id,
                      quarantined: true,
                    })
                  }
                >
                  {t.quarantineButton}
                </Button>
              )}
            </Box>
          )}
        </Stack>
      </Stack>
      <CompanyTabsContainer company={company} />
      {/*
        ⚠️ Always mounted and toggled through `isOpen`, never conditionally
        mounted — see the note at the company list's mount site. A dialog that
        mounts already-visible is hidden again by the click that opened it.
      */}
      <SendCompanyEmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        target={{
          mode: 'company',
          companyId: company.id,
          // The company's stored contact email, prefilled and editable. Null
          // when none is on file, which leaves the field empty and blocks
          // "Halda áfram" until one is typed.
          defaultEmail: company.email ?? null,
        }}
        // The send writes a CUSTOM_EMAIL_* event per recipient, so the
        // timeline is stale the moment the batch runs.
        onSent={invalidateCompany}
      />
    </Box>
  )
}
