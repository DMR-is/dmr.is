export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * Uploads a file straight to S3 using a presigned PUT URL obtained from the API.
 * Keeps the bytes out of the tRPC/Next request path entirely.
 *
 * `fallbackMime` is used only when the browser gives the `File` no type of its
 * own, which it does for extensions it does not recognise.
 */
export async function putFileToPresignedUrl(
  url: string,
  file: File,
  fallbackMime = 'application/octet-stream',
): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || fallbackMime },
  })

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`)
  }
}

/**
 * The workbook-specific form, kept so the import modal is untouched by mail
 * attachments arriving as a second caller.
 */
export async function putWorkbookToPresignedUrl(
  url: string,
  file: File,
): Promise<void> {
  return putFileToPresignedUrl(url, file, XLSX_MIME)
}
