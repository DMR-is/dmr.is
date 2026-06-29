'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { CompanyDto } from '../../../../gen/fetch'
import { companiesText } from '../../../../lib/text'
import { useTRPC } from '../../../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = companiesText.detailView

type Props = {
  company: CompanyDto
}

// Inline-editable value for the "Netfang" info item: shows the email (or a
// dash) with an edit button; the button swaps the value for an input + save.
export const CompanyEmailField = ({ company }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(company.email ?? '')

  const updateEmail = useMutation({
    ...trpc.company.updateEmail.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.company.get.queryKey() })
      toast.success(t.emailSavedToast)
      setIsEditing(false)
    },
    onError: () => toast.error(t.emailErrorToast),
  })

  const startEditing = () => {
    setValue(company.email ?? '')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setValue(company.email ?? '')
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <Box display="flex" alignItems="center" columnGap={1}>
        <Text>{company.email ? company.email : '—'}</Text>
        <Button
          variant="text"
          size="small"
          icon="pencil"
          iconType="outline"
          onClick={startEditing}
        >
          {t.emailEditButton}
        </Button>
      </Box>
    )
  }

  const trimmed = value.trim()
  // Empty input clears the email; the API rejects "" so send null instead.
  const nextEmail = trimmed === '' ? null : trimmed
  const isUnchanged = nextEmail === (company.email ?? null)

  return (
    <Box display="flex" flexDirection="column" rowGap={1} marginTop={1}>
      <Input
        name="company-email"
        type="email"
        size="xs"
        placeholder={t.emailPlaceholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Box display="flex" columnGap={1}>
        <Button
          size="small"
          onClick={() =>
            updateEmail.mutate({ id: company.id, email: nextEmail })
          }
          loading={updateEmail.isPending}
          disabled={isUnchanged}
        >
          {t.emailSaveButton}
        </Button>
        <Button
          variant="ghost"
          size="small"
          onClick={cancelEditing}
          disabled={updateEmail.isPending}
        >
          {t.emailCancelButton}
        </Button>
      </Box>
    </Box>
  )
}
