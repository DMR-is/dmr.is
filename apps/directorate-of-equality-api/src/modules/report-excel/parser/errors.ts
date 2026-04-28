/**
 * Collected parse errors with location context.
 *
 * The parser never throws on a single cell problem — it accumulates errors
 * into an `ErrorBag`, attempts to keep parsing everything else, and surfaces
 * the full list to the caller. Users get one round-trip per upload where
 * they see all their mistakes, rather than a whack-a-mole fix-one-find-one
 * experience.
 */

import { ImportErrorDto } from '../dto/import-error.dto'

export class ErrorBag {
  private readonly errors: ImportErrorDto[] = []

  add(
    sheet: string,
    message: string,
    opts?: { row?: number; column?: string },
  ): void {
    this.errors.push({
      sheet,
      row: opts?.row ?? null,
      column: opts?.column ?? null,
      message,
    })
  }

  get hasErrors(): boolean {
    return this.errors.length > 0
  }

  get list(): readonly ImportErrorDto[] {
    return this.errors
  }
}
