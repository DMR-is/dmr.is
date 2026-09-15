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
 * Two FKs on `scoring_role_step` cascade and had no usable index.
 *
 * `scoring_sub_criterion_step_id` had none at all, so deleting a þrep — which
 * the scale-replace path does on every write — had to sequentially scan the
 * assignment table to find the rows to cascade.
 *
 * `scoring_sub_criterion_id` has the identical shape: also ON DELETE CASCADE,
 * and the only index containing it is `UNIQUE (scoring_role_id,
 * scoring_sub_criterion_id)`, where it is the *trailing* column and so unusable
 * as a btree prefix. `deleteSubCriterion` cascades through exactly it on an
 * ordinary edit, so leaving it out would have applied this migration's own
 * reasoning to one of the two columns it describes.
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

      CREATE INDEX IF NOT EXISTS scoring_role_step_sub_id_idx
        ON scoring_role_step (scoring_sub_criterion_id);

      -- The target the composite FK references. Redundant as a uniqueness claim
      -- (id is already the primary key) and required as an FK target: Postgres
      -- will only reference a column list that carries a unique index.
      ALTER TABLE scoring_sub_criterion_step
        ADD CONSTRAINT scoring_sub_criterion_step_id_sub_key
        UNIQUE (id, scoring_sub_criterion_id);

      -- ADD CONSTRAINT validates every existing row and aborts the whole block
      -- if one fails, naming only the constraint. Surface the offenders first,
      -- so a failure here says which assignments are cross-wired rather than
      -- leaving someone to find them by hand.
      DO $$
      DECLARE bad int;
      BEGIN
        SELECT count(*) INTO bad
        FROM scoring_role_step rs
        JOIN scoring_sub_criterion_step st ON st.id = rs.scoring_sub_criterion_step_id
        WHERE st.scoring_sub_criterion_id IS DISTINCT FROM rs.scoring_sub_criterion_id;

        IF bad > 0 THEN
          RAISE EXCEPTION
            '% scoring_role_step row(s) name a þrep belonging to a different sub-criterion; resolve them before this migration can add the composite FK', bad;
        END IF;
      END $$;

      -- Replaces the single-column FK on the step: the pair has to resolve
      -- together, so a þrep from another sub-criterion cannot be named.
      ALTER TABLE scoring_role_step
        DROP CONSTRAINT IF EXISTS scoring_role_step_scoring_sub_criterion_step_id_fkey;

      ALTER TABLE scoring_role_step
        ADD CONSTRAINT scoring_role_step_step_matches_sub_fkey
        FOREIGN KEY (scoring_sub_criterion_step_id, scoring_sub_criterion_id)
        REFERENCES scoring_sub_criterion_step (id, scoring_sub_criterion_id)
        ON DELETE CASCADE;

      -- m-20260914 set this comment to say "the service asserts the step belongs
      -- to this sub-criterion", which was true when the table had two
      -- independent FKs. It is now the table's own guarantee, and the comment is
      -- a live database object rather than a line of source, so correcting it
      -- means re-issuing it here — editing the applied migration would change
      -- nothing in any database that has already run it.
      COMMENT ON COLUMN scoring_role_step.scoring_sub_criterion_id IS
        'Denormalised from the step''s own parent so the one-assignment-per-sub-criterion uniqueness can be a table constraint. The composite FK scoring_role_step_step_matches_sub_fkey ties the pair together, so a step from another sub-criterion cannot be named.';

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

      COMMENT ON COLUMN scoring_role_step.scoring_sub_criterion_id IS
        'Denormalised from the step''s own parent so the one-assignment-per-sub-criterion uniqueness can be a table constraint. The service asserts the step belongs to this sub-criterion.';

      DROP INDEX IF EXISTS scoring_role_step_step_id_idx;
      DROP INDEX IF EXISTS scoring_role_step_sub_id_idx;

      CREATE INDEX IF NOT EXISTS scoring_role_step_role_id_idx
        ON scoring_role_step (scoring_role_id);
      CREATE INDEX IF NOT EXISTS scoring_sub_criterion_step_sub_id_idx
        ON scoring_sub_criterion_step (scoring_sub_criterion_id);

      COMMIT;
    `)
  },
}
