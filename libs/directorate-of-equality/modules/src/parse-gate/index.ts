/**
 * Public surface of the `parse-gate` module.
 *
 * Unlike the service modules, the concrete class is exported: `Semaphore` is a
 * pure, framework-free utility rather than an implementation a caller should
 * be kept away from, and the DI indirection those modules protect does not
 * apply. Consumers still inject {@link PARSE_GATE} to get the shared instance
 * — constructing a `Semaphore` directly makes a second, unshared gate, which
 * is the one thing this module exists to prevent.
 */

export * from './parse-gate.core.module'
export * from './parse-gate.token'

// `Semaphore` is deliberately NOT re-exported. Publishing the constructor from
// the barrel is publishing the `new Semaphore(...)` this module exists to
// prevent — a second, unshared gate that leaves both importers looking bounded
// while the process holds twice the budgeted heap. The two specs that need the
// class reach it by relative path; nothing outside this directory should.
export { SemaphoreQueueFullError } from './semaphore'
