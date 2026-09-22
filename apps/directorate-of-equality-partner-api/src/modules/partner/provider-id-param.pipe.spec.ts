import { BadRequestException } from '@nestjs/common'

import { ProviderIdParamPipe } from './provider-id-param.pipe'

/**
 * The agreement this pipe exists to hold: a read normalises its `providerId`
 * the same way the submission did before storing it.
 *
 * Without it the write path trimmed and the read path did not, so an id that
 * reached us as `"042 "` was stored as `042` and then fetched as `042 ` — a
 * `404` on a report that exists, which reads to a vendor as "you never filed
 * it". The shared `normaliseProviderId` is what makes the two sides one rule;
 * these tests are what stop it quietly becoming two again.
 */
describe('ProviderIdParamPipe', () => {
  const pipe = new ProviderIdParamPipe()

  it.each([
    ['a trailing space, as a stray %20 arrives', '042 ', '042'],
    ['a leading space', ' 042', '042'],
    ['both', '  2026-Q1-042\t', '2026-Q1-042'],
  ])('normalises %s', (_case, sent, stored) => {
    expect(pipe.transform(sent)).toBe(stored)
  })

  it('leaves an already-normal id alone', () => {
    expect(pipe.transform('2026-Q1-042')).toBe('2026-Q1-042')
  })

  it.each([
    ['empty', ''],
    ['whitespace only', '   '],
    ['absent', undefined],
  ])('refuses a %s providerId rather than looking it up', (_case, value) => {
    expect(() => pipe.transform(value)).toThrow(BadRequestException)
  })

  /**
   * It deliberately does not re-check `PROVIDER_ID_PATTERN`: those values are
   * rewritten by a URL before routing, so they cannot arrive here as a path
   * segment at all. A check for them would read like a safeguard and be dead.
   */
  it('does not re-litigate the write-side charset rule', () => {
    expect(pipe.transform('2026.Q1.042')).toBe('2026.Q1.042')
  })
})
