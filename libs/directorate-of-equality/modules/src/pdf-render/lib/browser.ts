import * as puppeteer from 'puppeteer'

/**
 * Launches a headless Chromium instance for HTML→PDF rendering.
 *
 * In the deployed container we use the system Chromium shipped in the image, as
 * the Legal Gazette renderer does.
 *
 * ⚠️ **Locally we fall through to puppeteer's own browser**, not a hardcoded
 * `/Applications/Chromium.app`. That path used to be the default and is a bad
 * one: it is whatever Chromium the developer happens to have installed, and a
 * mismatched build breaks rendering in ways that read as application bugs — a
 * user-installed Chromium here never reported network-idle, so every render
 * failed with a 30s navigation timeout on a document with no network activity at
 * all. Omitting `executablePath` lets puppeteer use the browser it downloaded
 * and pinned, which is version-matched to the library by construction.
 *
 * `LOCAL_CHROMIUM_PATH` still overrides, for a developer who wants a specific
 * binary.
 */
export const getBrowser = async () => {
  return puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=none',
      '--disable-gpu',
    ],
    headless: true,
    protocolTimeout: 300_000,
    executablePath:
      process.env.NODE_ENV === 'production'
        ? '/usr/bin/chromium-browser'
        : process.env.LOCAL_CHROMIUM_PATH,
  })
}
