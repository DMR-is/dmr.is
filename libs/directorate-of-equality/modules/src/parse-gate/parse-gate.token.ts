import { Semaphore } from './semaphore'

/**
 * Injection token for the process-wide parse gate.
 *
 * Lives in its own file so a consumer can inject the gate without importing
 * `parse-gate.core.module`, which would pull the module into whatever graph
 * the importer belongs to.
 */
export const PARSE_GATE = Symbol('PARSE_GATE')

/** What {@link PARSE_GATE} resolves to. */
export type ParseGate = Semaphore
