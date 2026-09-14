'use strict'

/**
 * The company-scoped scoring model (starfsmat) for the partner API.
 *
 * ## Why these tables exist
 *
 * Every salary report today re-transmits its entire scoring model: the criteria
 * tree, every sub-criterion, every step description, and one step assignment per
 * (role x job-based sub-criterion) pair. All of it is report-scoped — no model
 * carries a `company_id` — so a company that files annually sends the same tree
 * every year, bound together by title strings.
 *
 * That is tolerable on the island.is surface, which has a UI to build it in, and
 * on the Excel surface, where the workbook carries it. It is not tolerable on the
 * partner API, where a payroll vendor holds none of it and would have to build
 * screens to collect the employer's starfsmat before it could file anything.
 *
 * These tables give the model a home of its own: authored once, referenced by id
 * from a filing. Nothing existing changes — at filing time the stored model is
 * expanded into exactly the `ParsedReportDto` the submission pipeline already
 * receives, so `report_criterion` and friends keep working as the per-report
 * frozen snapshot they already are. That snapshot is what makes a filed report
 * stay interpretable after the company reworks its model, which is why these
 * tables need no versioning.
 *
 * ## Two columns deliberately absent
 *
 * `scoring_criterion` has **no weight**. A criterion's weight is the sum of its
 * own sub-criteria's weights, and nothing else: `computeStepScore` reads only the
 * sub-criterion weight, so a criterion weight never enters a score. Storing it
 * separately is what allows a criterion to display 40% while its sub-criteria
 * account for 10% of what actually scores — both sums are checked against 100
 * independently and never against each other. Deriving it makes the displayed
 * figure true by construction and collapses the two weight rules into one.
 *
 * `scoring_sub_criterion_step` has **no score**. It is
 * `(step_order / numSteps) * sub_weight * SCORE_FACTOR`, computed at expansion.
 * Asking a caller to send it invites a vendor to file stig on a scale of their
 * own choosing, which nothing validates.
 *
 * ## Enum reuse
 *
 * `type` reuses `report_criterion_type_enum` rather than declaring a parallel
 * type. It is the same five values carrying the same domain meaning, and the
 * model reuses `ReportCriterionTypeEnum` to match.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE IF NOT EXISTS scoring_model (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
        name TEXT NOT NULL
      );

      COMMENT ON TABLE scoring_model IS 'A company''s starfsmat: the criteria tree and role step assignments a salary report is scored against. Authored once and referenced by id from a filing; expanded into the per-report snapshot (report_criterion et al) at submit, which is why this table needs no versioning.';

      -- The only access path: "show me this company's models".
      CREATE INDEX IF NOT EXISTS scoring_model_company_id_idx
        ON scoring_model (company_id);

      CREATE TABLE IF NOT EXISTS scoring_criterion (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        scoring_model_id UUID NOT NULL
          REFERENCES scoring_model(id) ON DELETE CASCADE,
        type report_criterion_type_enum NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL
      );

      COMMENT ON COLUMN scoring_criterion.type IS 'At least one criterion of each of the four job-based types is required for a model to be valid; at most one PERSONAL. Nothing forbids two criteria of the same type.';

      CREATE INDEX IF NOT EXISTS scoring_criterion_model_id_idx
        ON scoring_criterion (scoring_model_id);

      CREATE TABLE IF NOT EXISTS scoring_sub_criterion (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        scoring_criterion_id UUID NOT NULL
          REFERENCES scoring_criterion(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        weight NUMERIC(6, 4) NOT NULL
      );

      COMMENT ON COLUMN scoring_sub_criterion.weight IS 'The one weight distribution in the model. Every sub-criterion weight across the whole model sums to 100; a criterion''s weight is the sum of its own. This is the only weight that reaches a score.';

      CREATE INDEX IF NOT EXISTS scoring_sub_criterion_criterion_id_idx
        ON scoring_sub_criterion (scoring_criterion_id);

      CREATE TABLE IF NOT EXISTS scoring_sub_criterion_step (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        scoring_sub_criterion_id UUID NOT NULL
          REFERENCES scoring_sub_criterion(id) ON DELETE CASCADE,
        step_order INTEGER NOT NULL,
        description TEXT NOT NULL,

        UNIQUE (scoring_sub_criterion_id, step_order)
      );

      CREATE INDEX IF NOT EXISTS scoring_sub_criterion_step_sub_id_idx
        ON scoring_sub_criterion_step (scoring_sub_criterion_id);

      CREATE TABLE IF NOT EXISTS scoring_role (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        scoring_model_id UUID NOT NULL
          REFERENCES scoring_model(id) ON DELETE CASCADE,
        title TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS scoring_role_model_id_idx
        ON scoring_role (scoring_model_id);

      -- Row existence is the assignment; there is nothing to mutate, so no
      -- updated_at. Re-assigning a role's step deletes and re-inserts.
      CREATE TABLE IF NOT EXISTS scoring_role_step (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        scoring_role_id UUID NOT NULL
          REFERENCES scoring_role(id) ON DELETE CASCADE,
        scoring_sub_criterion_id UUID NOT NULL
          REFERENCES scoring_sub_criterion(id) ON DELETE CASCADE,
        scoring_sub_criterion_step_id UUID NOT NULL
          REFERENCES scoring_sub_criterion_step(id) ON DELETE CASCADE,

        -- Exactly one assignment per role per sub-criterion. The completeness
        -- rule (every role assigned on every job-based sub-criterion) is a
        -- validation concern, but "no more than one" is an invariant the table
        -- can hold on its own.
        UNIQUE (scoring_role_id, scoring_sub_criterion_id)
      );

      COMMENT ON COLUMN scoring_role_step.scoring_sub_criterion_id IS 'Denormalised from the step''s own parent so the one-assignment-per-sub-criterion uniqueness can be a table constraint. The service asserts the step belongs to this sub-criterion.';

      CREATE INDEX IF NOT EXISTS scoring_role_step_role_id_idx
        ON scoring_role_step (scoring_role_id);

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      DROP TABLE IF EXISTS scoring_role_step;
      DROP TABLE IF EXISTS scoring_role;
      DROP TABLE IF EXISTS scoring_sub_criterion_step;
      DROP TABLE IF EXISTS scoring_sub_criterion;
      DROP TABLE IF EXISTS scoring_criterion;
      DROP TABLE IF EXISTS scoring_model;

      COMMIT;
    `)
  },
}
