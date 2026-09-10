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

import { useMutation } from '@tanstack/react-query'

const t = companiesText.sendEmail

/** Mirrors the server caps, so a rejection is caught before the upload. */
const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENT_TOTAL_BYTES = 5 * 1024 * 1024

/**
 * ⚠️ Must stay in step with `BOUNDARY_EXTENSIONS[MAIL_ATTACHMENT]` on the API.
 * Checked here only so the admin gets a clear message instead of a 400 after a
 * pointless upload — the server's list is the one that decides.
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
 * ⚠️ `filter` is a snapshot of the list's filter at open time, deliberately not
 * a live read. An admin who changes the filter behind the modal must not thereby
 * change who the message they are about to confirm goes to.
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

type Props = {
  isOpen: boolean
  onClose: () => void
  target: SendCompanyEmailTarget
  /** Called after a successful queue, so the caller can refresh a timeline. */
  onSent?: () => void
}

export const SendCompanyEmailModal = ({
  isOpen,
  onClose,
  target,
  onSent,
}: Props) => {
  const trpc = useTRPC()

  const [step, setStep] = useState<'compose' | 'preview'>('compose')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [recipientEmail, setRecipientEmail] = useState(
    target.mode === 'company' ? (target.defaultEmail ?? '') : '',
  )
  const [attachments, setAttachments] = useState<StagedAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  /*
   * True while the OS file dialog is open.
   *
   * ⚠️ Opening a native file picker takes focus out of the document, and
   * returning from it puts focus back on `document.body` — outside the dialog.
   * `Modal` hardcodes `hideOnClickOutside`, so reakit reads that as the dialog
   * having been dismissed and fires `onVisibilityChange(false)`: cancelling the
   * picker closed the whole modal. This flag is what tells a real dismiss from
   * that one.
   */
  const filePickerRef = useRef(false)

  /*
   * Whether the modal has ever been opened.
   *
   * ⚠️ The body is gated on THIS, not on `isOpen`. `ModalBase` renders its
   * children regardless of visibility, so gating on `isOpen` gives two sources
   * of truth for one thing — and any moment where reakit still considers the
   * dialog visible while `isOpen` has gone false renders the title and close
   * button over an empty box. Gating on "has ever opened" cannot diverge: once
   * true it never goes back, so there is no state in which the shell is on
   * screen without its contents.
   *
   * It still buys what the `isOpen` gate was for — a TinyMCE instance is not
   * booted on every company list and detail page load, only once the admin
   * actually opens the modal.
   */
  const [hasOpened, setHasOpened] = useState(false)
  useEffect(() => {
    if (isOpen) setHasOpened(true)
  }, [isOpen])
  // Remounts the editor on reset — it is uncontrolled (value lives behind a
  // getter ref), so clearing state alone leaves the old body on screen.
  const editorKey = useRef(0)

  const isSingle = target.mode === 'company'

  /** Anything the admin has typed or uploaded and would not want silently dropped. */
  const hasDraft =
    !!subject.trim() || !!bodyHtml.trim() || attachments.length > 0

  /*
   * ⚠️ Needed because this component is always mounted (see the mount sites).
   * Its `useState` initialisers ran once when the page loaded, so an admin who
   * corrects the company's contact email on the info tab and then opens this
   * would otherwise be shown the address as it was at page load — and send to
   * it. Re-seeding on open is what keeps the prefill honest.
   */
  useEffect(() => {
    if (!isOpen) return

    /*
     * Belt and braces. `handleDismiss`, `handleCancel` and `handleSent` all
     * abandon any outstanding preview already, so by the time we reopen there
     * should be nothing stale left to arrive — but this makes that hold however
     * the modal was closed, including a caller that drops `isOpen` on its own.
     * The target is re-snapshotted on every open, so a response issued before
     * this point can no longer be trusted to describe it.
     */
    previewSessionRef.current += 1

    // Only when there is nothing to protect. A dismissed modal keeps its draft
    // (see `handleDismiss`), and re-seeding on reopen would throw away an
    // address the admin had already corrected for this message.
    if (hasDraft) return
    setRecipientEmail(
      target.mode === 'company' ? (target.defaultEmail ?? '') : '',
    )
    // Deliberately keyed on `isOpen` alone: `target` is a fresh object every
    // render, so including it would re-seed the field on each keystroke and
    // make the address uneditable.
  }, [isOpen])

  const buildPayload = () => ({
    subject: subject.trim(),
    bodyHtml,
    ...(isSingle
      ? {
          companyIds: [target.companyId],
          recipientEmail: recipientEmail.trim() || null,
        }
      : { filter: target.filter }),
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
   * The confirmation step's whole content: a resolved preview together with the
   * exact payload it was resolved for.
   *
   * ⚠️ One piece of state holding both, deliberately — NOT a preview alongside
   * a separately-rebuilt payload. `send` posts `approved.payload`, so the set
   * of recipients the admin approved and the set the API resolves are produced
   * from byte-identical input. Rebuilding the payload at send time from current
   * state is what let a preview taken against one filter be sent against
   * another; keeping them in one object makes that drift unrepresentable.
   */
  const [approved, setApproved] = useState<{
    payload: ReturnType<typeof buildPayload>
    preview: CompanyEmailPreviewDto
  } | null>(null)

  /*
   * Which composing session an in-flight preview belongs to.
   *
   * ⚠️ Bumped whenever the message being composed stops being the one an
   * outstanding preview was asked about, and a response carrying a stale id is
   * dropped. Necessary because this component is never unmounted: a request
   * started for filter A and dismissed mid-flight still resolves, and an
   * unguarded `onSuccess` would put the modal back on the confirmation step
   * while it is closed — so the next open would show A's recipients over a
   * target that is now B. React Query cannot do this for us; it has no idea
   * the target changed underneath it.
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
   * ⚠️ Only ever for attachments that were never submitted with a batch —
   * removing one in the compose step, or cancelling the whole message. NOT on
   * an ordinary dismiss, which keeps the draft and therefore keeps its
   * attachments, and never after `send`, where the staged object is the
   * message's only copy until the API has archived it.
   *
   * Fire and forget, failures swallowed: this is housekeeping on the admin's
   * own upload. A toast saying a file they already removed could not be
   * deleted describes nothing they can act on.
   */
  const discardStaged = (keys: string[]) => {
    for (const key of keys) {
      discardMutation.mutate({ key }, { onError: () => undefined })
    }
  }

  /*
   * ⚠️ No `onSuccess`/`onError` here — they are passed per call in
   * `requestPreview`, so each one closes over the session and the payload its
   * own request was issued with. A handler defined here would see only the
   * latest render's values and could not tell a stale response from a current
   * one.
   */
  const previewMutation = useMutation(
    trpc.companyEmail.preview.mutationOptions(),
  )

  const requestPreview = () => {
    const payload = buildPayload()
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
        // Same guard: an error toast for a message the admin has already
        // walked away from is noise about nothing they can act on.
        if (session !== previewSessionRef.current) return
        toast.error(t.previewError)
      },
    })
  }

  const sendMutation = useMutation({
    ...trpc.companyEmail.send.mutationOptions(),
    onSuccess: (result) => {
      // "Sett í sendingu", not "Sent" — the API returns before anything is
      // delivered, and saying otherwise would misreport a batch that is still
      // running (or about to start failing).
      toast.success(`${t.successToast} — ${result.recipientCount}`)
      onSent?.()
      handleSent()
    },
    onError: () => toast.error(t.errorToast),
  })

  const reset = () => {
    discardPreview()
    setSubject('')
    setBodyHtml('')
    setRecipientEmail(
      target.mode === 'company' ? (target.defaultEmail ?? '') : '',
    )
    setAttachments([])
    editorKey.current += 1
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /**
   * Explicit cancel: the draft is finished with and its uploads go with it.
   *
   * ⚠️ Separate from `handleSent` precisely because of that. Both clear the
   * draft, but only this one may delete the staged objects — after a send they
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
   * Esc and a backdrop click, which are as easy to hit by accident as on
   * purpose. They close the modal and keep the draft — the shell stays mounted,
   * so reopening finds the subject, the body and the staged attachments intact.
   * Resetting here would discard a composed message and up to five uploaded
   * files on one stray click, with nothing to say it had happened.
   */
  const handleDismiss = () => {
    // Not a dismiss at all — the OS file dialog took focus. Closing here threw
    // the admin out of a half-composed message for pressing Cancel on a file
    // picker.
    if (filePickerRef.current) return

    /*
     * ⚠️ The resolved preview is dropped and the modal rewound to compose, even
     * though the draft is kept — and any preview still in flight is abandoned
     * with it. The preview is only true of the target it was resolved against,
     * and the caller re-snapshots that target on every open (see the mount
     * site), so keeping either would reopen the modal already on the
     * confirmation step, showing the recipients and the count of the PREVIOUS
     * filter while the send went to the current one. Rewinding costs one
     * click; it is what keeps the count the admin approves and the recipients
     * they get the same set.
     */
    discardPreview()

    onClose()
  }

  const openFilePicker = () => {
    filePickerRef.current = true

    // Cleared when the browser window regains focus — i.e. the OS dialog has
    // closed either way — and a tick later, so the spurious dismiss that
    // arrives as focus re-enters the document has already been ignored. The
    // listener removes itself, so a picker opened repeatedly adds only one.
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
    // Belt and braces: `change` can only fire once the picker has closed, and
    // the ordering against the window focus event is not guaranteed.
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
    // still exceed it together, and SES would reject the whole message.
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
    } catch {
      toast.error(t.attachmentUploadError)
    } finally {
      setIsUploading(false)
    }
  }

  const canContinue =
    !!subject.trim() &&
    !!bodyHtml.trim() &&
    !isUploading &&
    (!isSingle || !!recipientEmail.trim())

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
    >
      {/* Gated on `hasOpened`, deliberately — see the note on that state. */}
      {!hasOpened ? null : step === 'compose' ? (
        <Stack space={3}>
          {isSingle && (
            <TextInput
              name="recipientEmail"
              label={t.recipientEmailLabel}
              type="email"
              size="xs"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          )}

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
                    // Nothing has been submitted yet, so the staged object is
                    // safe to delete: no batch references it and no draft is
                    // keeping it.
                    discardStaged([attachment.key])
                    setAttachments((prev) =>
                      prev.filter((a) => a.key !== attachment.key),
                    )
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
                Why the count here can be smaller than the one on the button
                that opened this modal. Rendered before the message preview so
                the discrepancy is answered where it is noticed.
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

              <Box>
                <Text variant="eyebrow" color="dark400">
                  {t.previewSubjectLabel}
                </Text>
                {/*
                  From the approved payload, not the live `subject` state, for
                  the same reason `send` posts that payload: what is on screen
                  at the confirmation step must be what was resolved, never a
                  later edit that never went through `preview`.
                */}
                <Text fontWeight="semiBold" marginBottom={2}>
                  {approved.payload.subject}
                </Text>
                <Box border="standard" borderRadius="large">
                  {/*
                    Read-only editor rather than `dangerouslySetInnerHTML`, the
                    same way a stored report body is rendered.

                    ⚠️ `preview.bodyHtml`, not the local editor state: the API
                    returns the body already sanitised, so anything the
                    sanitiser strips is gone before the admin approves it rather
                    than after. Otherwise this step would show markup the
                    recipient never gets.
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
        </Stack>
      )}
    </Modal>
  )
}
