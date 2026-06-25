'use client'

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

  const startFines = useMutation({
    ...trpc.company.updateFines.mutationOptions(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: trpc.company.get.queryKey() })
      toast.success(
        variables.finesStarted ? t.finesStartedToast : t.finesStoppedToast,
      )
    },
    onError: () => toast.error(t.finesErrorToast),
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
                  loading={startFines.isPending}
                  onClick={() =>
                    startFines.mutate({ id: company.id, finesStarted: false })
                  }
                >
                  {t.finesStopButton}
                </Button>
              </Box>
            </Box>
          )}
          {!company.finesStarted && (
            <Box marginBottom={4}>
              <Button
                size="small"
                variant="text"
                colorScheme="destructive"
                icon="gavel"
                iconType="outline"
                onClick={() =>
                  startFines.mutate({ id: company.id, finesStarted: true })
                }
              >
                {t.finesButton}
              </Button>
            </Box>
          )}
        </Stack>
      </Stack>
      <CompanyTabsContainer company={company} />
    </Box>
  )
}
