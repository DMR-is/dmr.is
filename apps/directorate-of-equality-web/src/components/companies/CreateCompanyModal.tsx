'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { companiesText, sharedText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { employeeCountCategoryFromCount } from './companyStatus'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const CreateCompanyModal = ({ isOpen, onClose }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [nationalIdInput, setNationalIdInput] = useState('')
  const [lookupNationalId, setLookupNationalId] = useState<string | null>(null)
  const [employeeCount, setEmployeeCount] = useState('')

  const lookupQuery = useQuery({
    ...trpc.company.rskPreview.queryOptions({
      nationalId: lookupNationalId ?? '',
    }),
    enabled: !!lookupNationalId,
    retry: false,
  })

  const createMutation = useMutation({
    ...trpc.company.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.company.list.queryKey() })
      toast.success(companiesText.createModal.successToast)
      handleClose()
    },
    onError: () => {
      toast.error(companiesText.createModal.errorToast)
    },
  })

  const handleClose = () => {
    setNationalIdInput('')
    setLookupNationalId(null)
    setEmployeeCount('')
    onClose()
  }

  const handleLookup = () => {
    if (nationalIdInput.trim()) {
      setLookupNationalId(nationalIdInput.trim())
    }
  }

  const handleCreate = () => {
    if (!lookupQuery.data || !employeeCount) return
    createMutation.mutate({
      nationalId: lookupQuery.data.nationalId,
      name: lookupQuery.data.name,
      employeeCountCategory: employeeCountCategoryFromCount(
        Number(employeeCount),
      ),
    })
  }

  const lookedUp = !!lookupQuery.data
  const isActive = lookupQuery.data?.status === 'ACTIVE'
  const isInactive = lookedUp && !isActive
  const notFound = lookupQuery.error?.data?.code === 'NOT_FOUND'
  const canCreate =
    lookedUp && isActive && !!employeeCount && Number(employeeCount) > 0

  return (
    <Modal
      baseId="create-company-modal"
      isVisible={isOpen}
      title={companiesText.createModal.title}
      onVisibilityChange={(visible) => {
        if (!visible) handleClose()
      }}
      toggleClose={handleClose}
      width="small"
    >
      <Stack space={3}>
        <Stack space={1}>
          <Inline space={2} alignY="center">
            <Box
              flexGrow={1}
              display="flex"
              justifyContent="flexEnd"
              alignItems="flexEnd"
              columnGap={2}
            >
              <TextInput
                name="nationalId"
                label={sharedText.form.kennitalaLabel}
                placeholder={companiesText.createModal.kennitalaPlaceholder}
                size="xs"
                value={nationalIdInput}
                onChange={(e) => {
                  setNationalIdInput(e.target.value)
                  if (lookupNationalId) setLookupNationalId(null)
                }}
              />
              <Button
                variant="ghost"
                size="small"
                loading={lookupQuery.isFetching}
                disabled={!nationalIdInput.trim()}
                onClick={handleLookup}
              >
                {companiesText.createModal.lookupButton}
              </Button>
            </Box>
          </Inline>
          {lookupQuery.isError &&
            (notFound ? (
              <AlertMessage
                type="warning"
                title={companiesText.createModal.notFoundTitle}
                message={companiesText.createModal.notFoundError}
              />
            ) : (
              <AlertMessage
                type="error"
                title={companiesText.createModal.lookupErrorTitle}
                message={companiesText.createModal.lookupError}
              />
            ))}
          {lookedUp && (
            <Box marginTop={1}>
              <AlertMessage
                type={isActive ? 'success' : 'error'}
                title={
                  isActive
                    ? companiesText.createModal.activeTitle
                    : companiesText.createModal.inactiveTitle
                }
                message={
                  isActive
                    ? companiesText.createModal.activeMessage
                    : lookupQuery.data?.statusReason ??
                      companiesText.createModal.inactiveFallbackReason
                }
              />
            </Box>
          )}
        </Stack>

        {lookedUp && (
          <>
            <TextInput
              name="name"
              label={companiesText.createModal.nameLabel}
              size="xs"
              value={lookupQuery.data?.name ?? ''}
              readOnly
            />

            <TextInput
              name="address"
              label={companiesText.createModal.addressLabel}
              size="xs"
              value={
                lookupQuery.data?.address ??
                companiesText.createModal.emptyValue
              }
              readOnly
            />

            <TextInput
              name="postcode"
              label={companiesText.createModal.postcodeLabel}
              size="xs"
              value={
                lookupQuery.data?.postcode ??
                companiesText.createModal.emptyValue
              }
              readOnly
            />

            <TextInput
              name="isatCategory"
              label={companiesText.createModal.isatCategoryLabel}
              size="xs"
              value={
                lookupQuery.data?.isatCategory ??
                companiesText.createModal.emptyValue
              }
              readOnly
            />

            <TextInput
              name="employeeCount"
              label={companiesText.createModal.employeeCountLabel}
              type="number"
              size="xs"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(e.target.value)}
              disabled={isInactive}
            />
          </>
        )}

        <Inline justifyContent="flexEnd" space={2}>
          <Button variant="ghost" size="small" onClick={handleClose}>
            {sharedText.form.cancel}
          </Button>
          <Button
            size="small"
            disabled={!canCreate}
            loading={createMutation.isPending}
            onClick={handleCreate}
          >
            {companiesText.createModal.submit}
          </Button>
        </Inline>
      </Stack>
    </Modal>
  )
}
