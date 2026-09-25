'use client'

import { useEffect, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { RadioButton } from '@dmr.is/ui/components/island-is/RadioButton'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { ToggleSwitchButton } from '@dmr.is/ui/components/island-is/ToggleSwitchButton'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { type UserDto } from '../../gen/fetch/types.gen'
import { sharedText, usersText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const u = usersText.modal
const f = sharedText.form

type Role = 'ADMIN' | 'EDITOR'

const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: u.roleAdmin, value: 'ADMIN' },
  { label: u.roleEditor, value: 'EDITOR' },
]

const ROLE_GROUP_LABEL_ID = 'user-role-label'

/** Digits only, so "010101-2345" and "0101012345" look up the same person. */
const sanitizeNationalId = (value: string) => value.replace(/\D/g, '')

type Props = {
  user: UserDto | null
  isOpen: boolean
  onClose: () => void
}

/**
 * Create or edit a reviewer.
 *
 * Creating starts from a kennitala alone. "Fletta upp" asks the national
 * registry for the person, and only then do the other fields open: the name
 * comes from the registry and is shown read-only, while email and phone — which
 * the registry does not hold — are typed in. A kennitala that is already a user
 * stops there with a warning, rather than failing with a 409 on save.
 *
 * Editing has no lookup: the kennitala cannot change, and the name stays
 * editable as before.
 */
export const UserModal = ({ user, isOpen, onClose }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [nationalId, setNationalId] = useState('')
  const [lookupNationalId, setLookupNationalId] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [role, setRole] = useState<Role>('ADMIN')

  const isNew = !user

  // Reset on every open, not only when `user` changes. The shared Modal stays
  // mounted while hidden, so its fields keep what was last typed, and creating
  // two users in a row passes `null` both times — keyed on `[user]` alone the
  // effect never re-ran, and the second form opened pre-filled with the first
  // user. The same held for reopening a user after cancelling an edit.
  useEffect(() => {
    if (!isOpen) return

    setNationalId('')
    setLookupNationalId(null)

    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setEmail(user.email)
      setPhone(user.phone ?? '')
      setIsActive(user.isActive)
      setRole(user.role)
    } else {
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setIsActive(true)
      setRole('ADMIN')
    }
  }, [user, isOpen])

  const lookupQuery = useQuery({
    ...trpc.user.lookup.queryOptions({ nationalId: lookupNationalId ?? '' }),
    enabled: isNew && isOpen && !!lookupNationalId,
    retry: false,
    // A point-in-time check, not a cacheable read: the shared 30s staleTime
    // would serve `alreadyUser: false` for a user created a moment ago, and a
    // kept cache entry would show that answer before a refetch corrected it.
    staleTime: 0,
    gcTime: 0,
    // Only on "Fletta upp". With staleTime 0 the defaults would ask the
    // registry about the person on every return to the tab, and a failed
    // background refetch would put an error alert over a form still filled in.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const lookup = lookupQuery.data
  // Names come from the registry. A single-word registry name leaves the last
  // name empty, and that one stays editable so the admin is not stuck.
  useEffect(() => {
    if (!lookup) return
    setFirstName(lookup.firstName)
    setLastName(lookup.lastName)
  }, [lookup])

  const { mutate: createUser, isPending: isCreating } = useMutation(
    trpc.user.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.user.list.queryKey() })
        // The kennitala just created is now a user; a cached lookup would
        // still say it is not, and let the next create run into a 409.
        queryClient.invalidateQueries({ queryKey: trpc.user.lookup.queryKey() })
        toast.success(u.createSuccess)
        onClose()
      },
      onError: (error) => {
        //TODO: Revisit error handling here, ideally the API would return a specific error code for this case instead of relying on the error message
        const userAlreadyExists = 'User with this national ID already exists'
        const message =
          error instanceof Error
            ? error.message === userAlreadyExists
              ? u.userAlreadyExists
              : u.createError + ' - ' + error.message
            : u.createError
        toast.error(message, { autoClose: 5000 })
      },
    }),
  )

  const { mutate: updateUser, isPending: isUpdating } = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.user.list.queryKey() })
        toast.success(u.saveSuccess)
        onClose()
      },
      onError: (error) => {
        const message =
          error instanceof Error
            ? u.saveError + ' - ' + error.message
            : u.saveError
        toast.error(message, { autoClose: 5000 })
      },
    }),
  )

  const isSaving = isCreating || isUpdating

  const lookedUp = isNew && !!lookup && lookup.nationalId === lookupNationalId
  const alreadyUser = lookedUp && lookup.alreadyUser
  // On create, nothing but the kennitala is open until the registry has
  // answered for a kennitala that is not already a user.
  const detailsOpen = !isNew || (lookedUp && !alreadyUser)
  const nameFromRegistry = isNew && lookedUp

  const lookupReason = lookupQuery.error?.data?.translatedMessage
  const lookupErrorCode = lookupQuery.error?.data?.code
  // Each answer gets its own title, so it never contradicts its message. A
  // 400 is an invalid or a company kennitala, and its message says which.
  const lookupAlert =
    lookupErrorCode === 'NOT_FOUND'
      ? { type: 'warning' as const, title: u.notFoundTitle }
      : lookupErrorCode === 'BAD_REQUEST'
        ? { type: 'warning' as const, title: u.unusableKennitalaTitle }
        : { type: 'error' as const, title: u.lookupErrorTitle }

  const handleLookup = () => {
    const sanitized = sanitizeNationalId(nationalId)
    if (sanitized.length !== 10) return

    // The same kennitala again would set the same state, keep the same query
    // key, and — with `retry: false` — send nothing, though the error says
    // "Reyndu aftur". Refetch instead.
    if (sanitized === lookupNationalId) {
      void lookupQuery.refetch()
    } else {
      setLookupNationalId(sanitized)
    }
  }

  const handleSave = () => {
    if (isNew) {
      if (!lookedUp) return
      createUser({
        nationalId: lookup.nationalId,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        role,
      })
    } else {
      updateUser({
        id: user.id,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        isActive,
        role,
      })
    }
  }

  return (
    <Modal
      baseId="user-modal"
      isVisible={isOpen}
      title={isNew ? u.createTitle : u.editTitle}
      onVisibilityChange={(visible) => {
        if (!visible) onClose()
      }}
      toggleClose={onClose}
      width="small"
    >
      <Stack space={3}>
        {isNew && (
          <Stack space={1}>
            <Box display="flex" alignItems="flexEnd" columnGap={2}>
              <Box flexGrow={1}>
                <TextInput
                  name="nationalId"
                  label={u.nationalIdLabel}
                  size="xs"
                  value={nationalId}
                  onChange={(e) => {
                    setNationalId(e.target.value)
                    // A new kennitala invalidates the previous lookup, and
                    // with it the names that came from it.
                    if (lookupNationalId) {
                      setLookupNationalId(null)
                      setFirstName('')
                      setLastName('')
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLookup()
                  }}
                />
              </Box>
              <Button
                variant="ghost"
                size="small"
                loading={lookupQuery.isFetching}
                disabled={sanitizeNationalId(nationalId).length !== 10}
                onClick={handleLookup}
              >
                {u.lookupButton}
              </Button>
            </Box>

            {!lookedUp && !lookupQuery.isError && (
              <Text variant="small" color="dark400">
                {u.lookupHint}
              </Text>
            )}

            {lookupQuery.isError && (
              <AlertMessage
                type={lookupAlert.type}
                title={lookupAlert.title}
                message={lookupReason ?? u.lookupError}
              />
            )}

            {alreadyUser && (
              <AlertMessage
                type="warning"
                title={u.alreadyUserTitle}
                message={u.userAlreadyExists}
              />
            )}

            {nameFromRegistry && !alreadyUser && (
              <Text variant="small" color="dark400">
                {u.nameFromRegistryHint(lookup.name)}
              </Text>
            )}
          </Stack>
        )}

        {/* Two equal columns across the full width. `Inline` sized each box to
            its content, so the pair stopped just past halfway. */}
        <Box display="flex" columnGap={2}>
          <Box flexGrow={1} style={{ flexBasis: 0, minWidth: 0 }}>
            <TextInput
              name="firstName"
              label={u.firstNameLabel}
              size="xs"
              value={firstName}
              disabled={!detailsOpen}
              readOnly={nameFromRegistry && !!lookup?.firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Box>
          <Box flexGrow={1} style={{ flexBasis: 0, minWidth: 0 }}>
            <TextInput
              name="lastName"
              label={u.lastNameLabel}
              size="xs"
              value={lastName}
              disabled={!detailsOpen}
              readOnly={nameFromRegistry && !!lookup?.lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Box>
        </Box>

        <TextInput
          name="email"
          label={f.emailLabel}
          type="email"
          size="xs"
          value={email}
          disabled={!detailsOpen}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextInput
          name="phone"
          label={f.phoneShortLabel}
          size="xs"
          value={phone}
          disabled={!detailsOpen}
          onChange={(e) => setPhone(e.target.value)}
        />

        {/* Radio buttons, not a Select: island-ui's Select renders its menu
            inline, so the modal's scrolling body clipped it at the bottom edge
            and on a short screen it could barely be opened. Two roles fit side
            by side, and `allowOverflow` is not an option here — this modal is
            tall enough that the form itself would then spill off the card. */}
        <div role="radiogroup" aria-labelledby={ROLE_GROUP_LABEL_ID}>
          <Stack space={1}>
            <Text
              id={ROLE_GROUP_LABEL_ID}
              variant="small"
              fontWeight="semiBold"
              color={detailsOpen ? 'blue400' : 'dark300'}
            >
              {u.roleLabel}
            </Text>
            <Box display="flex" columnGap={2}>
              {ROLE_OPTIONS.map((option) => (
                <Box
                  key={option.value}
                  flexGrow={1}
                  style={{ flexBasis: 0, minWidth: 0 }}
                >
                  <RadioButton
                    id={`user-role-${option.value}`}
                    name="role"
                    value={option.value}
                    label={option.label}
                    checked={role === option.value}
                    disabled={!detailsOpen}
                    onChange={() => setRole(option.value)}
                    large
                    backgroundColor="blue"
                  />
                </Box>
              ))}
            </Box>
          </Stack>
        </div>

        {!isNew && (
          <Box>
            <Text variant="eyebrow" color="blue400" marginBottom={1}>
              {u.statusEyebrow}
            </Text>

            <ToggleSwitchButton
              expander
              label={u.activeLabel}
              checked={isActive}
              onChange={() => setIsActive((prev) => !prev)}
              onFocus={undefined}
              onBlur={undefined}
            />
          </Box>
        )}

        <Inline justifyContent="flexEnd" space={2}>
          <Button variant="ghost" size="small" onClick={onClose}>
            {f.cancel}
          </Button>
          <Button
            size="small"
            loading={isSaving}
            disabled={
              isSaving ||
              !detailsOpen ||
              !firstName.trim() ||
              !lastName.trim() ||
              !email.trim()
            }
            onClick={handleSave}
          >
            {isNew ? u.create : u.save}
          </Button>
        </Inline>
      </Stack>
    </Modal>
  )
}
