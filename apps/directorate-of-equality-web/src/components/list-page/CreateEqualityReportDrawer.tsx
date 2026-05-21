'use client'

import { useRef, useState } from 'react'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Drawer } from '@dmr.is/ui/components/island-is/Drawer'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { overviewText, sharedText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'
import { UtilityButton } from '../buttons/UtilityButton'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const GENDER_OPTIONS = [
  { label: sharedText.genders.male, value: 'MALE' as const },
  { label: sharedText.genders.female, value: 'FEMALE' as const },
  { label: sharedText.genders.neutral, value: 'NEUTRAL' as const },
]

const EMPTY_FORM = {
  companyAdminName: '',
  companyAdminEmail: '',
  companyAdminGender: 'MALE' as 'MALE' | 'FEMALE' | 'NEUTRAL',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  equalityReportContent: '',
}

export const CreateEqualityReportDrawer = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const editorKey = useRef(0)

  const set = (key: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const companiesQuery = useQuery(
    trpc.company.list.queryOptions({ pageSize: 1000 }),
  )

  const companyOptions = (companiesQuery.data?.companies ?? []).map((c) => ({
    label: `${c.name} (${formatNationalId(c.nationalId)})`,
    value: c.id,
  }))

  const submitMutation = useMutation({
    ...trpc.adminReport.submitEquality.mutationOptions(),
    onSuccess: () => {
      toast.success(overviewText.createEqualityReport.successToast)
      queryClient.invalidateQueries({ queryKey: trpc.reports.list.queryKey() })
      handleReset()
    },
    onError: () => toast.error(sharedText.form.errorToast),
  })

  const handleReset = () => {
    setForm(EMPTY_FORM)
    setCompanyId(null)
    editorKey.current += 1
  }

  const handleSubmit = () => {
    if (!companyId) return
    submitMutation.mutate({
      path: { companyId },
      body: {
        providerType: 'SYSTEM',
        companyAdminName: form.companyAdminName,
        companyAdminEmail: form.companyAdminEmail,
        companyAdminGender: form.companyAdminGender,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        equalityReportContent: form.equalityReportContent,
      },
    })
  }

  const canSubmit =
    !!companyId &&
    !!form.companyAdminName &&
    !!form.companyAdminEmail &&
    !!form.contactName &&
    !!form.contactEmail &&
    !!form.contactPhone &&
    !!form.equalityReportContent

  return (
    <Drawer
      ariaLabel={overviewText.createEqualityReport.drawerLabel}
      baseId="create-equality-report-drawer"
      disclosure={
        <UtilityButton icon="add">
          {overviewText.createEqualityReport.buttonLabel}
        </UtilityButton>
      }
    >
      <GridContainer>
        <Stack space={4}>
          <Text variant="h2">{overviewText.createEqualityReport.heading}</Text>

          <GridRow rowGap={[2, 3]}>
            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                {sharedText.form.companyHeading}
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '8/12']}>
              <Select
                name="company"
                label={sharedText.form.companySelect}
                options={companyOptions}
                value={
                  companyOptions.find((o) => o.value === companyId) ?? null
                }
                onChange={(opt) => setCompanyId(opt?.value ?? null)}
                isLoading={companiesQuery.isLoading}
                size="xs"
                backgroundColor="blue"
              />
            </GridColumn>

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                {sharedText.form.topManagerHeading}
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="companyAdminName"
                label={sharedText.form.nameLabel}
                size="xs"
                value={form.companyAdminName}
                onChange={(e) => set('companyAdminName')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="companyAdminEmail"
                label={sharedText.form.emailLabel}
                type="email"
                size="xs"
                value={form.companyAdminEmail}
                onChange={(e) => set('companyAdminEmail')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <Select
                name="companyAdminGender"
                label={sharedText.form.genderLabel}
                options={GENDER_OPTIONS}
                value={GENDER_OPTIONS.find(
                  (o) => o.value === form.companyAdminGender,
                )}
                onChange={(opt) => opt && set('companyAdminGender')(opt.value)}
                size="xs"
                backgroundColor="blue"
              />
            </GridColumn>

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                {sharedText.form.contactHeading}
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="contactName"
                label={sharedText.form.nameLabel}
                size="xs"
                value={form.contactName}
                onChange={(e) => set('contactName')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="contactEmail"
                label={sharedText.form.emailLabel}
                type="email"
                size="xs"
                value={form.contactEmail}
                onChange={(e) => set('contactEmail')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <TextInput
                name="contactPhone"
                label={sharedText.form.phoneLabel}
                type="tel"
                size="xs"
                value={form.contactPhone}
                onChange={(e) => set('contactPhone')(e.target.value)}
                disabled={!companyId}
              />
            </GridColumn>

            <GridColumn span="12/12">
              <Text variant="h4" marginBottom={1}>
                Skýrsla
              </Text>
            </GridColumn>
            <GridColumn span="12/12">
              <Box
                border="standard"
                position="relative"
                zIndex={10}
                borderRadius="large"
              >
                <HTMLEditor
                  key={editorKey.current}
                  disabled={!companyId}
                  defaultValue={form.equalityReportContent}
                  handleUpload={() => new Error('File upload not supported')}
                  onChange={(value) => set('equalityReportContent')(value)}
                  config={{
                    toolbar:
                      'bold italic underline | align numlist bullist | link',
                  }}
                />
              </Box>
            </GridColumn>

            <GridColumn span="12/12">
              <Inline justifyContent="flexEnd" space={2}>
                <Button variant="ghost" size="small" onClick={handleReset}>
                  {sharedText.form.reset}
                </Button>
                <Button
                  size="small"
                  disabled={!canSubmit}
                  loading={submitMutation.isPending}
                  onClick={handleSubmit}
                >
                  {sharedText.form.submit}
                </Button>
              </Inline>
            </GridColumn>
          </GridRow>
        </Stack>
      </GridContainer>
    </Drawer>
  )
}
