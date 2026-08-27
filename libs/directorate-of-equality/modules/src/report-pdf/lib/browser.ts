import * as puppeteer from 'puppeteer'

/**
 * Launches a headless Chromium instance for HTML→PDF rendering.
 *
 * Mirrors the Legal Gazette PDF browser setup: in production we use the
 * system Chromium shipped in the container image, locally we fall back to a
 * developer-installed Chromium (override with `LOCAL_CHROMIUM_PATH`).
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
        : (process.env.LOCAL_CHROMIUM_PATH ??
          '/Applications/Chromium.app/Contents/MacOS/Chromium'),
  })
}
