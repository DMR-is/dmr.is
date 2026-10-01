/**
 * The filename the API chose, from `Content-Disposition`.
 *
 * Prefers RFC 5987 `filename*=UTF-8''…`, which the API always sends alongside
 * an ASCII-folded `filename="…"` — the plain one would turn "fyrirtæki" into
 * "fyrirt_ki".
 */
export const fileNameFromDisposition = (
  disposition: string | null,
): string | null => {
  if (!disposition) return null

  const extended = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition)
  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim())
    } catch {
      // Malformed encoding: fall through to the plain parameter.
    }
  }

  const plain = /filename\s*=\s*"([^"]*)"/i.exec(disposition)
  return plain?.[1] || null
}

/** Hands a fetched file to the browser's own download. */
export const saveBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Deferred: revoking in the same tick can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
