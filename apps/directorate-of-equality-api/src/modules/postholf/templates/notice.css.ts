/**
 * Print styles for the served notices.
 *
 * Everything is inline — no webfont, no remote logo. `page.setContent` runs with
 * `waitUntil: 'networkidle0'`, so a single remote asset makes render latency
 * unbounded, and these documents are rendered inside a request island.is is
 * waiting on.
 */
export const noticeStyles = `
  @page { margin: 24mm 20mm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; font-size: 11pt; line-height: 1.6; }
  .notice__header { display: flex; justify-content: space-between; font-size: 10pt; color: #444; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
  .notice__sender { font-weight: bold; letter-spacing: 0.04em; text-transform: uppercase; }
  .notice__recipient { margin: 28px 0; font-size: 10.5pt; }
  .notice__heading { font-size: 15pt; margin: 32px 0 20px; }
  .notice p { margin: 0 0 14px; }
  .notice__footer { margin-top: 48px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 10pt; color: #444; }
`
