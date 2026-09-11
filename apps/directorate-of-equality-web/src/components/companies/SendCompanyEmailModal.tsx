'use client'

import { useEffect, useRef, useState } from 'react'

import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import {
  CompanyEmailPreviewDto,
  CompanyEmailRecipientStatusEnum,
} from '../../gen/fetch'
import { putFileToPresignedUrl } from '../../lib/import-upload'
import { companiesText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import {
  CompanyEmailRecipientList,
  RecipientRow,
} from './CompanyEmailRecipientList'
import {
  commitRecipientDraft,
  isCompleteEmail,
  RecipientEmailsInput,
} from './RecipientEmailsInput'

import { useMutation, useQuery } from '@tanstack/react-query'

const t = companiesText.sendEmail

/** Mirrors the server caps, so a rejection is caught before the upload. */
const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENT_TOTAL_BYTES = 5 * 1024 * 1024

/** Mirrors `MAX_RECIPIENT_EMAILS` on the API. */
const MAX_RECIPIENTS = 10

/**
 * Must stay in step with `BOUNDARY_EXTENSIONS[MAIL_ATTACHMENT]` on the API,
 * which is the list that actually decides. Checked here only so the admin gets
 * a clear message instead of a 400 after a pointless upload.
 */
const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xlsx',
  'xls',
  'csv',
  'txt',
  'png',
  'jpg',
  'jpeg',
]

const EDITOR_TOOLBAR = 'bold italic underline | align numlist bullist | link'

const SKIP_REASON_LABEL: Record<string, string> = {
  [CompanyEmailRecipientStatusEnum.SKIPPED_NO_EMAIL]: t.skippedNoEmail,
  [CompanyEmailRecipientStatusEnum.SKIPPED_QUARANTINED]: t.skippedQuarantined,
}

type StagedAttachment = {
  key: string
  filename: string
  sizeBytes: number
}

/**
 * Who the message is addressed to, captured when the modal opens.
 *
 * `filter` is a snapshot, not a live read: changing the list's filter behind
 * the modal must not change who the message being confirmed goes to.
 */
export type SendCompanyEmailTarget =
  | {
      mode: 'company'
      companyId: string
      /** Prefills the address field; the admin may correct it for this message. */
      defaultEmail: string | null
    }
  | {
      mode: 'filter'
      filter: Record<string, unknown>
    }

/**
 * How the address field should start out for a target.
 *
 * A stored address that does not look finished goes into the draft rather than
 * becoming a pill — a pill reads as settled, and the API refuses an address it
 * cannot send to, so the admin has to be able to see and fix it.
 */
const seedRecipients = (
  target: SendCompanyEmailTarget,
): { emails: string[]; draft: string } => {
  const stored = target.mode === 'company' ? (target.defaultEmail ?? '') : ''

  return isCompleteEmail(stored)
    ? { emails: [stored.trim()], draft: '' }
    : { emails: [], draft: stored }
}

type Props = {
  isOpen: boolean
  onClose: () => void
  target: SendCompanyEmailTarget
}

export const SendCompanyEmailModal = ({
  isOpen,
  onClose,
  target,
}: Props) => {
  const trpc = useTRPC()

  const [step, setStep] = useState<'compose' | 'preview'>('compose')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [recipientEmails, setRecipientEmails] = useState<string[]>(
    () => seedRecipients(target).emails,
  )
  /*
   * What is in the address box but not yet a pill. Held here rather than inside
   * `RecipientEmailsInput` because "Halda áfram" has to be able to commit it: an
   * address typed and then clicked straight past is one the admin believes they
   * entered.
   */
  const [recipientDraft, setRecipientDraft] = useState(
    () => seedRecipients(target).draft,
  )
  const [copyToEmail, setCopyToEmail] = useState('')
  /*
   * Whether the admin has edited the copy field themselves. The prefill address
   * arrives asynchronously (see `me`) and can land after typing has started, so
   * without this the seeding effect would overwrite a corrected address.
   */
  const copyToTouched = useRef(false)
  /*
   * The same guard for the address box. Both feed `hasDraft`: a dismissed modal
   * keeps its draft, and hand-typed addresses are work too — without these the
   * re-seeding effect threw them away on reopen.
   */
  const recipientsTouched = useRef(false)
  const [attachments, setAttachments] = useState<StagedAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  /*
   * True while the OS file dialog is open.
   *
   * Returning from a native picker puts focus on `document.body`, outside the
   * dialog, and `Modal` hardcodes `hideOnClickOutside` — so reakit reads that as
   * a dismiss. This flag tells a real dismiss from that one.
   */
  const filePickerRef = useRef(false)

  /*
   * Whether the modal has ever been opened. The body is gated on this rather
   * than on `isOpen`: `ModalBase` renders children regardless of visibility, and
   * any moment where reakit still considers the dialog visible while `isOpen` is
   * false would render the title and close button over an empty box.
   *
   * It still keeps TinyMCE from booting on every company page load.
   */
  const [hasOpened, setHasOpened] = useState(false)
  useEffect(() => {
    if (isOpen) setHasOpened(true)
  }, [isOpen])
  // Remounts the editor on reset — it is uncontrolled (value lives behind a
  // getter ref), so clearing state alone leaves the old body on screen.
  const editorKey = useRef(0)

  /*
   * The sender's own address, which the copy field is prefilled with. Not on the
   * session — `authOptions` carries no email. Gated on `hasOpened` so an unopened
   * modal does not fetch a user record; the timeline uses the same cached query.
   */
  const { data: me } = useQuery({
    ...trpc.user.getMyUser.queryOptions(),
    enabled: hasOpened,
  })
  const myEmail = me?.email ?? ''

  useEffect(() => {
    if (copyToTouched.current) return
    setCopyToEmail(myEmail)
  }, [myEmail])

  const isSingle = target.mode === 'company'

  const handleRecipientsChange = (next: string[]) => {
    recipientsTouched.current = true
    setRecipientEmails(next)
  }

  const handleRecipientDraftChange = (next: string) => {
    recipientsTouched.current = true
    setRecipientDraft(next)
  }

  /*
   * What the address box would come to if it were committed now. Computed once
   * and read by `hasUnfinishedAddress`, `canContinue` and `requestPreview`, so
   * the cap, the button state and the payload cannot disagree.
   */
  const committedRecipients = commitRecipientDraft(
    recipientEmails,
    recipientDraft,
    MAX_RECIPIENTS,
  )

  /** Anything the admin has typed or uploaded and would not want silently dropped. */
  const hasDraft =
    !!subject.trim() ||
    !!bodyHtml.trim() ||
    attachments.length > 0 ||
    recipientsTouched.current ||
    copyToTouched.current

  /*
   * This component is always mounted, so the `useState` initialisers ran at page
   * load. Re-seeding on open is what keeps the prefill honest when the admin has
   * corrected the company's contact email on the info tab since then.
   */
  useEffect(() => {
    if (!isOpen) return

    /*
     * Belt and braces — `handleDismiss`, `handleCancel` and `handleSent` already
     * abandon any outstanding preview. Rewinds rather than only abandoning what
     * is in flight: the target is re-snapshotted on every open, so a resolved
     * preview from before this point describes the previous target.
     */
    discardPreview()

    // Only when there is nothing to protect. A dismissed modal keeps its draft,
    // and re-seeding would throw away an already-corrected address.
    if (hasDraft) return

    const seed = seedRecipients(target)
    setRecipientEmails(seed.emails)
    setRecipientDraft(seed.draft)
    setCopyToEmail(myEmail)
    copyToTouched.current = false
    recipientsTouched.current = false
    // Keyed on `isOpen` alone: `target` is a fresh object every render, so
    // including it would re-seed the field on each keystroke.
  }, [isOpen])

  /*
   * `emails` is passed in rather than read from state because `requestPreview`
   * commits the address box first and React has not re-rendered by then.
   */
  const buildPayload = (emails: string[]) => ({
    subject: subject.trim(),
    bodyHtml,
    ...(isSingle
      ? {
          companyIds: [target.companyId],
          recipientEmails: emails,
        }
      : { filter: target.filter }),
    ...(copyToEmail.trim() ? { copyToEmail: copyToEmail.trim() } : {}),
    ...(attachments.length
      ? {
          attachments: attachments.map(({ key, filename }) => ({
            key,
            filename,
          })),
        }
      : {}),
  })

  /**
   * The confirmation step's content: a resolved preview together with the exact
   * payload it was resolved for.
   *
   * One piece of state holding both, so `send` posts `approved.payload` and the
   * recipients the admin approved are resolved from byte-identical input.
   * Rebuilding the payload at send time let a preview taken against one filter
   * be sent against another.
   */
  const [approved, setApproved] = useState<{
    payload: ReturnType<typeof buildPayload>
    preview: CompanyEmailPreviewDto
  } | null>(null)

  /*
   * Which composing session an in-flight preview belongs to. Bumped whenever the
   * message stops being the one an outstanding preview was asked about, and a
   * response carrying a stale id is dropped.
   *
   * Needed because this component is never unmounted: an unguarded `onSuccess`
   * would put a closed modal back on the confirmation step for the old target.
   */
  const previewSessionRef = useRef(0)

  /** Abandon any outstanding preview and rewind to compose. Keeps the draft. */
  const discardPreview = () => {
    previewSessionRef.current += 1
    setApproved(null)
    setStep('compose')
  }

  const presignMutation = useMutation(
    trpc.companyEmail.presignAttachment.mutationOptions(),
  )

  const discardMutation = useMutation(
    trpc.companyEmail.discardAttachment.mutationOptions(),
  )

  /**
   * Delete staged objects the admin has decided against.
   *
   * Only for attachments never submitted with a batch — removing one while
   * composing, or cancelling. Not on an ordinary dismiss, which keeps the draft,
   * and never after `send`, where the staged object is the only copy until the
   * API has archived it. Fire and forget: failures are housekeeping the admin
   * cannot act on.
   */
  const discardStaged = (keys: string[]) => {
    for (const key of keys) {
      discardMutation.mutate({ key }, { onError: () => undefined })
    }
  }

  /*
   * No `onSuccess`/`onError` here — they are passed per call in `requestPreview`,
   * so each closes over the session and payload its own request was issued with.
   */
  const previewMutation = useMutation(
    trpc.companyEmail.preview.mutationOptions(),
  )

  const requestPreview = () => {
    // Commit whatever is still loose in the address box first. `canContinue` has
    // already refused a box with a remainder, so this is the same list it was
    // judged on.
    const { emails, remainder } = committedRecipients
    setRecipientEmails(emails)
    setRecipientDraft(remainder)

    const payload = buildPayload(emails)
    previewSessionRef.current += 1
    const session = previewSessionRef.current

    previewMutation.mutate(payload as never, {
      onSuccess: (result) => {
        // Dismissed, rewound, or superseded while this was in flight.
        if (session !== previewSessionRef.current) return
        setApproved({ payload, preview: result })
        setStep('preview')
      },
      onError: () => {
        // Same guard: an error toast for a message the admin has walked away
        // from is noise.
        if (session !== previewSessionRef.current) return
        toast.error(t.previewError)
      },
    })
  }

  const sendMutation = useMutation({
    ...trpc.companyEmail.send.mutationOptions(),
    onSuccess: (result) => {
      // "Sett í sendingu", not "Sent" — the API returns before anything is
      // delivered.
      toast.success(`${t.successToast} — ${result.recipientCount}`)
      handleSent()
    },
    onError: () => toast.error(t.errorToast),
  })

  const reset = () => {
    discardPreview()
    setSubject('')
    setBodyHtml('')

    const seed = seedRecipients(target)
    setRecipientEmails(seed.emails)
    setRecipientDraft(seed.draft)
    setCopyToEmail(myEmail)
    copyToTouched.current = false
    recipientsTouched.current = false

    setAttachments([])
    editorKey.current += 1
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /**
   * Explicit cancel: the draft is finished with and its uploads go with it.
   *
   * Separate from `handleSent` for that reason — after a send the staged objects
   * belong to the batch.
   */
  const handleCancel = () => {
    discardStaged(attachments.map((a) => a.key))
    reset()
    onClose()
  }

  /** A send that went through. Clears the draft but leaves its uploads alone. */
  const handleSent = () => {
    reset()
    onClose()
  }

  /*
   * Esc and a backdrop click, as easy to hit by accident as on purpose. They
   * close the modal and keep the draft: the shell stays mounted, so reopening
   * finds the subject, body and staged attachments intact.
   */
  const handleDismiss = () => {
    // Not a dismiss at all — the OS file dialog took focus. Closing here threw
    // the admin out of a half-composed message for cancelling a file picker.
    if (filePickerRef.current) return

    /*
     * The resolved preview is dropped and the modal rewound to compose, even
     * though the draft is kept. The preview is only true of the target it was
     * resolved against, and the caller re-snapshots that target on every open —
     * so keeping it would reopen on the confirmation step showing the previous
     * filter's recipients while the send went to the current one.
     */
    discardPreview()

    onClose()
  }

  const openFilePicker = () => {
    filePickerRef.current = true

    // Cleared when the window regains focus — the OS dialog has closed either
    // way — and a tick later, so the spurious dismiss that arrives as focus
    // re-enters has already been ignored. The listener removes itself.
    const done = () => {
      window.removeEventListener('focus', done)
      setTimeout(() => {
        filePickerRef.current = false
      }, 0)
    }
    window.addEventListener('focus', done)

    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Belt and braces: the ordering of `change` against the window focus event
    // is not guaranteed.
    filePickerRef.current = false

    const file = e.target.files?.[0]
    // Cleared immediately so picking the same file twice still fires `change`.
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return

    if (attachments.length >= MAX_ATTACHMENTS) {
      toast.error(t.attachmentTooManyError)
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error(t.attachmentTypeError)
      return
    }

    // The running total, matching the server: five files each under the cap can
    // still exceed it together.
    const total = attachments.reduce((sum, a) => sum + a.sizeBytes, 0)
    if (total + file.size > MAX_ATTACHMENT_TOTAL_BYTES) {
      toast.error(t.attachmentTooLargeError)
      return
    }

    setIsUploading(true)
    try {
      const { url, key } = await presignMutation.mutateAsync({
        filename: file.name,
      })
      await putFileToPresignedUrl(url, file)
      setAttachments((prev) => [
        ...prev,
        { key, filename: file.name, sizeBytes: file.size },
      ])
      // The approved payload is frozen when the preview resolves, so a file added
      // while one is in flight would be missing from what is actually sent.
      discardPreview()
    } catch {
      toast.error(t.attachmentUploadError)
    } finally {
      setIsUploading(false)
    }
  }

  /*
   * Loose text in the address or copy field that is not a whole address. The
   * field shows its own message; this stops "Halda áfram" from dropping it
   * silently or sending it to an API that will 400.
   */
  const hasUnfinishedAddress =
    // Anything committing would leave behind — a half-typed address, or whole
    // ones with no room under the cap.
    !!committedRecipients.remainder ||
    (!!copyToEmail.trim() && !isCompleteEmail(copyToEmail))

  const canContinue =
    !!subject.trim() &&
    !!bodyHtml.trim() &&
    !isUploading &&
    !hasUnfinishedAddress &&
    // Whole addresses still sitting in the box count: `requestPreview` commits
    // them, so refusing here would block a form the admin has filled in.
    (!isSingle || committedRecipients.emails.length > 0)

  const recipientRows: RecipientRow[] = (
    approved?.preview.recipients ?? []
  ).map((r) => ({
    companyId: r.companyId,
    companyName: r.companyName,
    email: r.email ?? null,
  }))

  const skippedRows: RecipientRow[] = (approved?.preview.skipped ?? []).map(
    (r) => ({
      companyId: r.companyId,
      companyName: r.companyName,
      email: r.email ?? null,
      note: SKIP_REASON_LABEL[r.reason] ?? undefined,
    }),
  )

  return (
    <Modal
      baseId="send-company-email-modal"
      isVisible={isOpen}
      title={t.title}
      onVisibilityChange={(visible) => {
        if (!visible) handleDismiss()
      }}
      toggleClose={handleDismiss}
      width="large"
      /*
       * Pins the title and this row, so a long message scrolls between them
       * rather than taking "Senda" off the bottom. Gated on `hasOpened` like the
       * body, so the shell is never on screen over an empty box.
       */
      footer={
        !hasOpened ? null : step === 'compose' ? (
          <Inline justifyContent="flexEnd" space={2}>
            <Button variant="ghost" size="small" onClick={handleCancel}>
              {t.cancel}
            </Button>
            <Button
              size="small"
              disabled={!canContinue}
              loading={previewMutation.isPending}
              onClick={requestPreview}
            >
              {t.continue}
            </Button>
          </Inline>
        ) : (
          <Inline justifyContent="flexEnd" space={2}>
            <Button variant="ghost" size="small" onClick={discardPreview}>
              {t.back}
            </Button>
            <Button
              size="small"
              disabled={!approved || approved.preview.recipientCount === 0}
              loading={sendMutation.isPending}
              onClick={() =>
                approved && sendMutation.mutate(approved.payload as never)
              }
            >
              {`${t.send} (${approved?.preview.recipientCount ?? 0})`}
            </Button>
          </Inline>
        )
      }
    >
      {/* Gated on `hasOpened`, deliberately — see the note on that state. */}
      {!hasOpened ? null : step === 'compose' ? (
        <Stack space={3}>
          {isSingle && (
            <RecipientEmailsInput
              label={t.recipientEmailsLabel}
              hint={t.recipientEmailsHint}
              emails={recipientEmails}
              draft={recipientDraft}
              max={MAX_RECIPIENTS}
              onChange={handleRecipientsChange}
              onDraftChange={handleRecipientDraftChange}
            />
          )}

          {/*
            Safe on a bulk send: the API sends exactly one copy per batch rather
            than a BCC on every message.
          */}
          <Box>
            <TextInput
              name="copyToEmail"
              label={t.copyToLabel}
              type="email"
              size="xs"
              value={copyToEmail}
              onChange={(e) => {
                copyToTouched.current = true
                setCopyToEmail(e.target.value)
              }}
              hasError={!!copyToEmail.trim() && !isCompleteEmail(copyToEmail)}
              errorMessage={
                !!copyToEmail.trim() && !isCompleteEmail(copyToEmail)
                  ? t.copyToInvalid
                  : undefined
              }
            />
            <Text variant="small" color="dark400" marginTop={1}>
              {t.copyToHint}
            </Text>
          </Box>

          <TextInput
            name="subject"
            label={t.subjectLabel}
            size="xs"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Box>
            <Text variant="eyebrow" color="dark400" marginBottom={1}>
              {t.bodyLabel}
            </Text>
            <Box
              border="standard"
              position="relative"
              zIndex={10}
              borderRadius="large"
            >
              <HTMLEditor
                key={editorKey.current}
                defaultValue={bodyHtml}
                handleUpload={() => new Error('File upload not supported')}
                onChange={setBodyHtml}
                config={{ toolbar: EDITOR_TOOLBAR }}
              />
            </Box>
          </Box>

          <Box>
            <Text variant="eyebrow" color="dark400">
              {t.attachmentsLabel}
            </Text>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {attachments.map((attachment) => (
              <Inline key={attachment.key} space={2} alignY="center">
                <Text variant="small">{attachment.filename}</Text>
                <Button
                  variant="text"
                  size="small"
                  colorScheme="destructive"
                  icon="close"
                  iconType="outline"
                  onClick={() => {
                    // Nothing submitted yet, so the staged object is safe to
                    // delete: no batch references it.
                    discardStaged([attachment.key])
                    setAttachments((prev) =>
                      prev.filter((a) => a.key !== attachment.key),
                    )
                    // A preview in flight would otherwise freeze this file into
                    // the approved payload after it has been deleted.
                    discardPreview()
                  }}
                >
                  {t.removeAttachment}
                </Button>
              </Inline>
            ))}
            <Box marginTop={1}>
              <Button
                variant="ghost"
                size="small"
                icon="attach"
                iconType="outline"
                loading={isUploading}
                disabled={attachments.length >= MAX_ATTACHMENTS}
                onClick={openFilePicker}
              >
                {t.addAttachment}
              </Button>
            </Box>
            <Text variant="small" color="dark300" marginTop={1}>
              {t.attachmentLimits}
            </Text>
          </Box>

        </Stack>
      ) : (
        <Stack space={3}>
          {previewMutation.isPending && (
            <SkeletonLoader repeat={3} height={24} space={1} />
          )}

          {approved && (
            <>
              <Box>
                <Text variant="small" color="dark300" marginBottom={1}>
                  {t.previewMessage}
                </Text>
              </Box>
              <CompanyEmailRecipientList
                heading={t.recipientsHeading}
                rows={recipientRows}
              />

              {/*
                Why the count here can be smaller than the one on the button that
                opened the modal. Rendered before the message preview so the
                discrepancy is answered where it is noticed.
              */}
              {skippedRows.length > 0 && (
                <CompanyEmailRecipientList
                  heading={t.skippedHeading}
                  rows={skippedRows}
                  tone="warning"
                />
              )}

              {approved.preview.recipientCount === 0 && (
                <Text variant="small" color="red600">
                  {t.noRecipients}
                </Text>
              )}

              {/*
                From the approved payload — the copy address resolved with the
                preview, not a later edit that never went through it.
              */}
              {!!approved.payload.copyToEmail && (
                <Text variant="small" color="dark400">
                  {t.previewCopyToLabel}: {approved.payload.copyToEmail}
                </Text>
              )}

              <Box>
                <Text variant="eyebrow" color="dark400">
                  {t.previewSubjectLabel}
                </Text>
                {/*
                  From the approved payload, not the live `subject` state: what is
                  on screen at the confirmation step must be what was resolved.
                */}
                <Text fontWeight="semiBold" marginBottom={2}>
                  {approved.payload.subject}
                </Text>
                <Box border="standard" borderRadius="large">
                  {/*
                    `preview.bodyHtml`, not the local editor state: the API returns
                    the body already sanitised, so anything stripped is gone before
                    the admin approves it rather than after.
                  */}
                  <HTMLEditor
                    readonly
                    disabled
                    defaultValue={approved.preview.bodyHtml}
                    handleUpload={() => new Error('File upload not supported')}
                  />
                </Box>
                {!!approved.payload.attachments?.length && (
                  <Box marginTop={2}>
                    <Text variant="eyebrow" color="dark400">
                      {t.attachmentsLabel}
                    </Text>
                    {approved.payload.attachments.map((attachment) => (
                      <Text key={attachment.key} variant="small">
                        {attachment.filename}
                      </Text>
                    ))}
                  </Box>
                )}
              </Box>
            </>
          )}

        </Stack>
      )}
    </Modal>
  )
}
