export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * Uploads a workbook straight to S3 using a presigned PUT URL obtained from the
 * API. Keeps the bytes out of the tRPC/Next request path entirely.
 */
export async function putWorkbookToPresignedUrl(
  url: string,
  file: File,
): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || XLSX_MIME },
  })

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`)
  }
}
