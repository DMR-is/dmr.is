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
 * ⚠️ Deliberately stricter than the API's `looksLikeOneAddress`, which only
 * rejects what a transport would mis-split. This one also wants a dot in the
 * domain, because its job is different: the server is deciding whether a value
 * is *safe to send*, and this is deciding whether the admin has finished
 * typing. Committing `jon@fyrirtaeki` into a pill the moment they hit space
 * would take the cursor away mid-address.
 */
export const isCompleteEmail = (value: string): boolean =>
  /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value.trim())

/**
 * Take everything finished out of the draft and add it to the list.
 *
 * Returns the new list together with whatever could not be committed, which the
 * caller puts back in the input. Splitting on separators as well as whitespace
 * is what makes a pasted `a@x.is, b@x.is` land as two pills.
 *
 * ⚠️ Pure, and exported, because the parent has to be able to run it on
 * "Halda áfram" as well: an address typed but never followed by a space is one
 * the admin believes they have entered, and dropping it silently at preview
 * time would send the message to everyone except the person they typed last.
 *
 * ⚠️ The cap is enforced here rather than by the caller trimming the result,
 * and that is the whole point: an address that does not fit goes back into the
 * remainder, never on the floor. Truncating instead would leave the admin
 * looking at `max` pills with nothing to say that the rest of what they pasted
 * was dropped — the same silent loss this function exists to prevent.
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

    // Same address twice is one message — see `normaliseRecipientEmails` on the
    // API, which does the same thing for callers that are not this form. Not
    // pushed back: a duplicate is nothing the admin has to act on.
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
 * The draft text is held by the parent rather than here, because the parent
 * needs it at preview time — see `commitRecipientDraft`. This component owns
 * only when a draft becomes a pill.
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
   * field or by pressing a separator key.
   *
   * ⚠️ What gates the error message, rather than showing it the moment the draft
   * is not yet a whole address: without this the field goes red on the first
   * character of every address typed into it, and re-announces the error on
   * each keystroke after that. Cleared again on the next keystroke, so fixing a
   * flagged address clears the flag as the admin types.
   */
  const [hasTriedToCommit, setHasTriedToCommit] = useState(false)

  const isFull = emails.length >= max

  const commit = () => {
    if (!draft.trim()) return

    setHasTriedToCommit(true)

    // Anything that could not become a pill — malformed, or past the cap —
    // comes back as the remainder and stays visible in the box.
    const { emails: next, remainder } = commitRecipientDraft(emails, draft, max)
    onChange(next)
    onDraftChange(remainder)
  }

  const remove = (email: string) => {
    onChange(emails.filter((e) => e !== email))
    /*
     * ⚠️ Focus has to be put somewhere deliberately: the button that took the
     * click is about to be unmounted, and a keyboard user who lands on
     * `document.body` has lost their place in the dialog entirely. The input is
     * where they were working.
     */
    inputRef.current?.focus()
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',' || e.key === ';') {
      // ⚠️ Enter would otherwise submit the surrounding form, and the separator
      // keys would be typed into the value that is about to become a pill.
      e.preventDefault()
      commit()
      return
    }

    // Familiar from every mail client: backspace at the start of an empty box
    // takes the last address back for editing rather than merely deleting it.
    if (e.key === 'Backspace' && !draft && emails.length) {
      e.preventDefault()
      onChange(emails.slice(0, -1))
      onDraftChange(emails[emails.length - 1])
    }
  }

  /*
   * Judged per token, the way `commitRecipientDraft` splits it — so the message
   * describes what committing would actually do with the box. A remainder of
   * `'k@x.is l@x.is'` after a paste over the cap is two whole addresses with no
   * room, not one malformed one, and saying "invalid address" there would send
   * the admin looking for a typo that is not present.
   */
  const tokens = draft.split(/[\s,;]+/).filter(Boolean)
  const isDraftIncomplete = tokens.some((token) => !isCompleteEmail(token))
  // Whole addresses with no room left for them. Flagged rather than swallowed:
  // `commit` leaves them in the box, and without a message the admin would be
  // looking at an address that never becomes a recipient.
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

            ⚠️ `role="list"` alongside the `ul`, not instead of it: Safari drops
            list semantics from a `ul` whose `list-style` is `none`, which is
            exactly what the reset below sets — and the role is what puts the
            count back. Same reason as on `CompanyEmailRecipientList`.
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
                  // tabbing through five identical buttons cannot otherwise
                  // tell which one drops which recipient.
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
        // `text`, not `email`: the field holds a draft that may briefly be a
        // paste of several addresses, and the browser's own single-address
        // validation would flag that as invalid while it is being split up.
        type="text"
        inputMode="email"
        autoComplete="off"
        value={draft}
        /*
         * ⚠️ Never disabled, not even at the cap. The cap is reached by
         * committing an address *from this field*, so disabling it there would
         * take focus off the element the admin is typing in and drop it on
         * `document.body` — a keyboard user would be thrown out of the dialog
         * by successfully adding a recipient. It refuses the entry and says so
         * instead.
         */
        onChange={(e) => {
          setHasTriedToCommit(false)
          onDraftChange(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        // The address someone typed and then clicked away from is one they
        // consider entered. Leaving it as loose text would silently drop it.
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
