'use strict'

/**
 * Index tidy-up on the scoring tables, and the composite FK that makes a
 * cross-wired assignment unrepresentable.
 *
 * ## The redundant indexes
 *
 * Two of the three explicit indexes created with these tables duplicate the
 * leading column of a UNIQUE constraint declared three lines above them:
 *
 *   scoring_role_step_role_id_idx (scoring_role_id)
 *     vs UNIQUE (scoring_role_id, scoring_sub_criterion_id)
 *   scoring_sub_criterion_step_sub_id_idx (scoring_sub_criterion_id)
 *     vs UNIQUE (scoring_sub_criterion_id, step_order)
 *
 * A btree on `(a, b)` already serves every lookup a btree on `(a)` does, so
 * both were pure write cost on tables the replace-whole writes rewrite in bulk.
 *
 * ## The index that was missing
 *
 * `scoring_role_step.scoring_sub_criterion_step_id` is an FK with ON DELETE
 * CASCADE and had no index at all, so deleting a þrep — which the scale-replace
 * path does on every write — had to sequentially scan the assignment table to
 * find the rows to cascade.
 *
 * ## The composite FK
 *
 * `scoring_role_step` carries both `scoring_sub_criterion_id` and
 * `scoring_sub_criterion_step_id`. The first is denormalised from the second's
 * own parent, so that "at most one assignment per job per sub-criterion" can be
 * a table constraint — but nothing tied the two together. A row naming þrep X
 * (which belongs to sub-criterion A) alongside sub-criterion B satisfied both
 * single-column FKs, and the expansion would then emit sub-criterion B at þrep
 * X's order: a silently wrong score.
 *
 * The service refuses that, and so does the expander now, but neither is the
 * table's own guarantee. Referencing `(id, scoring_sub_criterion_id)` on the
 * þrep makes the drift unrepresentable rather than merely caught — the
 * difference between an invariant and a convention.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS scoring_role_step_role_id_idx;
      DROP INDEX IF EXISTS scoring_sub_criterion_step_sub_id_idx;

      CREATE INDEX IF NOT EXISTS scoring_role_step_step_id_idx
        ON scoring_role_step (scoring_sub_criterion_step_id);

      -- The target the composite FK references. Redundant as a uniqueness claim
      -- (id is already the primary key) and required as an FK target: Postgres
      -- will only reference a column list that carries a unique index.
      ALTER TABLE scoring_sub_criterion_step
        ADD CONSTRAINT scoring_sub_criterion_step_id_sub_key
        UNIQUE (id, scoring_sub_criterion_id);

      -- Replaces the single-column FK on the step: the pair has to resolve
      -- together, so a þrep from another sub-criterion cannot be named.
      ALTER TABLE scoring_role_step
        DROP CONSTRAINT IF EXISTS scoring_role_step_scoring_sub_criterion_step_id_fkey;

      ALTER TABLE scoring_role_step
        ADD CONSTRAINT scoring_role_step_step_matches_sub_fkey
        FOREIGN KEY (scoring_sub_criterion_step_id, scoring_sub_criterion_id)
        REFERENCES scoring_sub_criterion_step (id, scoring_sub_criterion_id)
        ON DELETE CASCADE;

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE scoring_role_step
        DROP CONSTRAINT IF EXISTS scoring_role_step_step_matches_sub_fkey;

      ALTER TABLE scoring_role_step
        ADD CONSTRAINT scoring_role_step_scoring_sub_criterion_step_id_fkey
        FOREIGN KEY (scoring_sub_criterion_step_id)
        REFERENCES scoring_sub_criterion_step (id)
        ON DELETE CASCADE;

      ALTER TABLE scoring_sub_criterion_step
        DROP CONSTRAINT IF EXISTS scoring_sub_criterion_step_id_sub_key;

      DROP INDEX IF EXISTS scoring_role_step_step_id_idx;

      CREATE INDEX IF NOT EXISTS scoring_role_step_role_id_idx
        ON scoring_role_step (scoring_role_id);
      CREATE INDEX IF NOT EXISTS scoring_sub_criterion_step_sub_id_idx
        ON scoring_sub_criterion_step (scoring_sub_criterion_id);

      COMMIT;
    `)
  },
}
