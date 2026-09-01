'use strict'

/**
 * `company_comment.is_system` — marks a comment the system wrote rather than a
 * person.
 *
 * ## Why a column and not just a NULL author
 *
 * `author_user_id` has always been nullable, so a system-authored comment could
 * be written today without any schema change. The problem is the read side:
 * `CompanyCommentModel.fromModel` returns `authorName: null` when there is no
 * author, and the timeline renders a null author as **"Starfsmaður skráir
 * skilaboð"** (`timelineHelpers.tsx`, falling back to `text.ts`
 * `timeline.employee`). A seeded note would therefore appear on the company's
 * timeline as though an unnamed member of staff had typed it.
 *
 * A boolean separates the two cases that a null author conflates — "the system
 * wrote this" and "we do not know who wrote this" — so the UI can label the
 * first without guessing. The alternative, treating every null author as the
 * system, would silently relabel any future author-less admin comment.
 *
 * The immediate need is the first production company-register load, which seeds
 * each company's "Breytingar / Áður flokkað" note from the retired SharePoint
 * register (see `legacy_report`). Those are the Directorate's own words, but no
 * user in this system wrote them.
 *
 * ## Not an author-kind enum
 *
 * `report_comment` has a visibility/author-kind dimension because report
 * comments are exchanged with the company. Company comments are
 * reviewer-internal only, so the only distinction that exists here is
 * person-or-system, and a boolean says exactly that. If a third author kind
 * ever appears, this becomes an enum then — with one real second value it would
 * be speculation.
 *
 * ## Backfill
 *
 * Defaults to `false`, which is correct for every existing row: production has
 * only admin-authored company comments at the time of writing, and any row with
 * a null author predates this column and genuinely is of unknown authorship
 * rather than system-written. The load sets `true` explicitly on the rows it
 * seeds.
 *
 * ⚠️ A `CHECK (NOT is_system OR author_user_id IS NULL)` was considered and left
 * out. It is true of everything we intend to write, but it would also forbid the
 * plausible future case of an automated comment attributed to the admin whose
 * action triggered it, and the invariant is not one anything reads.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE company_comment
        ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

      COMMENT ON COLUMN company_comment.is_system IS 'True when the system wrote this comment rather than a person — currently only notes seeded by the company-register load from the retired SharePoint register. Distinguishes "the system wrote this" from "author unknown", which a null author_user_id alone conflates; the timeline renders a null author as "Starfsmaður" without it.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE company_comment
        DROP COLUMN IF EXISTS is_system;

      COMMIT;
    `)
  },
}
