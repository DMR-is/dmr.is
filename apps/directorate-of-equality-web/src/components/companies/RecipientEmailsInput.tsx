'use client'

import { useRef, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { companiesText } from '../../lib/text'

const t = companiesText.sendEmail

/**
 * What counts as an address worth turning into a pill.
 *
 * Stricter than the API's `looksLikeOneAddress`, which only rejects what a
 * transport would mis-split: this one decides whether the admin has finished
 * typing, so it also wants a dot in the domain. Committing `jon@fyrirtaeki`
 * on the first space would take the cursor away mid-address.
 */
export const isCompleteEmail = (value: string): boolean =>
  /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value.trim())

/**
 * Take everything finished out of the draft and add it to the list.
 *
 * Returns the new list plus whatever could not be committed, which the caller
 * puts back in the input. Splitting on separators as well as whitespace is what
 * makes a pasted `a@x.is, b@x.is` land as two pills.
 *
 * Pure and exported so the parent can run it on "Halda áfram" too: an address
 * typed but never followed by a space is one the admin believes they entered.
 * The cap is enforced here so an address that does not fit goes back into the
 * remainder rather than on the floor.
 */
export const commitRecipientDraft = (
  emails: string[],
  draft: string,
  max: number,
): { emails: string[]; remainder: string } => {
  const seen = new Set(emails.map((email) => email.toLowerCase()))
  const next = [...emails]
  const leftover: string[] = []

  for (const token of draft.split(/[\s,;]+/).filter(Boolean)) {
    if (!isCompleteEmail(token)) {
      leftover.push(token)
      continue
    }

    // The same address twice is one message. Not pushed back — a duplicate is
    // nothing the admin has to act on.
    if (seen.has(token.toLowerCase())) continue

    if (next.length >= max) {
      leftover.push(token)
      continue
    }

    seen.add(token.toLowerCase())
    next.push(token)
  }

  return { emails: next, remainder: leftover.join(' ') }
}

type Props = {
  label: string
  hint: string
  emails: string[]
  draft: string
  max: number
  onChange: (emails: string[]) => void
  onDraftChange: (draft: string) => void
}

/**
 * Addresses as removable pills, the way every mail client writes a To field.
 *
 * The draft text is held by the parent, which needs it at preview time — see
 * `commitRecipientDraft`. This component owns only when a draft becomes a pill.
 */
export const RecipientEmailsInput = ({
  label,
  hint,
  emails,
  draft,
  max,
  onChange,
  onDraftChange,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  /*
   * Whether the admin has asked for the draft to become a pill — by leaving the
   * field or pressing a separator key. Gates the error message: without it the
   * field goes red on the first character of every address and re-announces on
   * each keystroke. Cleared on the next keystroke, so fixing clears the flag.
   */
  const [hasTriedToCommit, setHasTriedToCommit] = useState(false)

  const isFull = emails.length >= max

  const commit = () => {
    if (!draft.trim()) return

    setHasTriedToCommit(true)

    // Anything that could not become a pill — malformed, or past the cap — comes
    // back as the remainder and stays visible in the box.
    const { emails: next, remainder } = commitRecipientDraft(emails, draft, max)
    onChange(next)
    onDraftChange(remainder)
  }

  const remove = (email: string) => {
    onChange(emails.filter((e) => e !== email))
    // Focus has to be placed deliberately: the button that took the click is
    // about to unmount, and a keyboard user would otherwise land on
    // `document.body`, outside the dialog.
    inputRef.current?.focus()
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',' || e.key === ';') {
      // Enter would otherwise submit the surrounding form, and the separator keys
      // would be typed into the value that is about to become a pill.
      e.preventDefault()
      commit()
      return
    }

    // Familiar from every mail client: backspace in an empty box takes the last
    // address back for editing rather than merely deleting it.
    if (e.key === 'Backspace' && !draft && emails.length) {
      e.preventDefault()
      onChange(emails.slice(0, -1))
      onDraftChange(emails[emails.length - 1])
    }
  }

  /*
   * Judged per token, the way `commitRecipientDraft` splits it, so the message
   * describes what committing would do. A remainder of `'k@x.is l@x.is'` is two
   * whole addresses with no room, not one malformed address.
   */
  const tokens = draft.split(/[\s,;]+/).filter(Boolean)
  const isDraftIncomplete = tokens.some((token) => !isCompleteEmail(token))
  // Whole addresses with no room left. Flagged rather than swallowed: `commit`
  // leaves them in the box, where they would otherwise never become recipients.
  const isOverCap = !isDraftIncomplete && tokens.length > 0 && isFull

  const errorMessage = !hasTriedToCommit
    ? undefined
    : isDraftIncomplete
      ? t.recipientEmailInvalid
      : isOverCap
        ? t.recipientEmailsFull
        : undefined

  return (
    <Box>
      {emails.length > 0 && (
        <Box marginBottom={1}>
          {/*
            A real list, so a screen reader announces how many recipients there
            are before reading them — the count is the thing being checked here.
            The style reset is inline because the bullets and padding are the
            browser's, not the theme's.

            `role="list"` alongside the `ul`: Safari drops list semantics from a
            `ul` with `list-style: none`, which the reset below sets. Same reason
            as on `CompanyEmailRecipientList`.
          */}
          <Box
            component="ul"
            role="list"
            display="flex"
            flexWrap="wrap"
            columnGap={1}
            rowGap={1}
            style={{ listStyle: 'none', margin: 0, padding: 0 }}
          >
            {emails.map((email) => (
              <Box
                key={email}
                component="li"
                background="blue100"
                borderRadius="large"
                paddingLeft={2}
                display="flex"
                alignItems="center"
                columnGap={1}
              >
                <Text variant="small">{email}</Text>
                <Button
                  circle
                  size="small"
                  variant="ghost"
                  icon="close"
                  iconType="outline"
                  // Names the address, not just "remove": a screen-reader user
                  // tabbing through identical buttons cannot otherwise tell
                  // which one drops which recipient.
                  aria-label={`${t.removeRecipient} ${email}`}
                  onClick={() => remove(email)}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* `Input` rather than the `TextInput` wrapper: this one needs a ref, so
          the focus can be put back after a pill is removed. */}
      <Input
        ref={inputRef}
        // Matching the other compose fields, which pass `xs` to `TextInput`.
        size="xs"
        backgroundColor="blue"
        name="recipientEmailDraft"
        label={label}
        // `text`, not `email`: the draft may briefly be a paste of several
        // addresses, which the browser's own validation would flag as invalid.
        type="text"
        inputMode="email"
        autoComplete="off"
        value={draft}
        /*
         * Never disabled, not even at the cap — the cap is reached by committing
         * an address from this very field, so disabling it would drop focus on
         * `document.body` and throw a keyboard user out of the dialog. It
         * refuses the entry and says so instead.
         */
        onChange={(e) => {
          setHasTriedToCommit(false)
          onDraftChange(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        // An address someone typed and then clicked away from is one they consider
        // entered. Leaving it as loose text would silently drop it.
        onBlur={commit}
        hasError={!!errorMessage}
        errorMessage={errorMessage}
      />

      <Text variant="small" color="dark400" marginTop={1}>
        {hint}
      </Text>
    </Box>
  )
}
