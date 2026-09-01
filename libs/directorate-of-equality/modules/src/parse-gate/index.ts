/**
 * Public surface of the `parse-gate` module.
 *
 * Narrower than the service modules', not wider. Consumers inject
 * {@link PARSE_GATE} to get the one shared instance; the concrete `Semaphore`
 * is not published, because constructing one directly makes a second, unshared
 * gate — the one thing this module exists to prevent.
 *
 * An earlier version of this note argued the opposite, that the class is a
 * pure framework-free utility nobody needs protecting from. That is true of
 * the class and irrelevant to the barrel: what is dangerous is not calling
 * `new Semaphore(...)`, it is calling it *instead of* injecting the gate.
 */

export * from './parse-gate.core.module'
export * from './parse-gate.token'

// `Semaphore` is deliberately NOT re-exported. Publishing the constructor from
// the barrel is publishing the `new Semaphore(...)` this module exists to
// prevent — a second, unshared gate that leaves both importers looking bounded
// while the process holds twice the budgeted heap. The two specs that need the
// class reach it by relative path; nothing outside this directory should.
export { SemaphoreQueueFullError } from './semaphore'
