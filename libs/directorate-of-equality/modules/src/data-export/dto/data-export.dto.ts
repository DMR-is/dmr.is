/**
 * One exported file: the bytes plus what to call them.
 *
 * The filename is built server-side rather than by the controller so the
 * dataset and the date are named once, in the place that knows both.
 */
export type DataExportFileDto = {
  fileName: string
  contentType: string
  content: Buffer
}
