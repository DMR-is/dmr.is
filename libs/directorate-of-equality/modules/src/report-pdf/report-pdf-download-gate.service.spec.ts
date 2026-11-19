import { ServiceUnavailableException } from '@nestjs/common'

import {
  MAX_CONCURRENT_PDF_DOWNLOADS,
  MAX_QUEUED_PDF_DOWNLOADS,
  REPORT_PDF_DOWNLOAD_BUSY,
  ReportPdfDownloadGate,
} from './report-pdf-download-gate.service'

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

/** A render that stays in flight until the test lets it finish. */
const heldRender = () => {
  let finish!: () => void
  const done = new Promise<string>((resolve) => {
    finish = () => resolve('pdf')
  })
  return { render: jest.fn(() => done), finish }
}

describe('ReportPdfDownloadGate', () => {
  let gate: ReportPdfDownloadGate

  beforeEach(() => {
    jest.clearAllMocks()
    gate = new ReportPdfDownloadGate(logger as never)
  })

  it('runs a render and returns its result', async () => {
    await expect(gate.run(async () => 'pdf')).resolves.toBe('pdf')
  })

  it('sheds with a 503, without rendering, once the slots and queue are full', async () => {
    const held = Array.from(
      { length: MAX_CONCURRENT_PDF_DOWNLOADS + MAX_QUEUED_PDF_DOWNLOADS },
      heldRender,
    )
    const inFlight = held.map(({ render }) => gate.run(render))

    const shed = jest.fn()
    await expect(gate.run(shed)).rejects.toThrow(ServiceUnavailableException)
    expect(shed).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ errorCode: REPORT_PDF_DOWNLOAD_BUSY }),
    )

    held.forEach(({ finish }) => finish())
    await Promise.all(inFlight)
  })

  it('runs no more than the limit at once', async () => {
    const held = Array.from(
      { length: MAX_CONCURRENT_PDF_DOWNLOADS + 1 },
      heldRender,
    )
    const inFlight = held.map(({ render }) => gate.run(render))
    await Promise.resolve()

    const started = held.filter(({ render }) => render.mock.calls.length > 0)
    expect(started).toHaveLength(MAX_CONCURRENT_PDF_DOWNLOADS)

    held.forEach(({ finish }) => finish())
    await Promise.all(inFlight)
    expect(held.every(({ render }) => render.mock.calls.length === 1)).toBe(
      true,
    )
  })

  it('frees the slot when a render throws', async () => {
    for (let i = 0; i < MAX_CONCURRENT_PDF_DOWNLOADS; i++) {
      await expect(
        gate.run(async () => {
          throw new Error('render failed')
        }),
      ).rejects.toThrow('render failed')
    }

    await expect(gate.run(async () => 'pdf')).resolves.toBe('pdf')
  })
})
