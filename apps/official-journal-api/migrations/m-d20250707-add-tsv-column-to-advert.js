'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add the tsv column
    await queryInterface.sequelize.query(`
      ALTER TABLE advert
      ADD COLUMN tsv tsvector GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(subject, '') || ' ' || coalesce(document_html, ''))
      ) STORED;
    `)

    // 2. Add the GIN index
    await queryInterface.sequelize.query(`
      CREATE INDEX advert_tsv_idx ON advert USING GIN (tsv);
    `)
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Drop the index
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS advert_tsv_idx;
    `)

    // 2. Drop the tsv column
    await queryInterface.sequelize.query(`
      ALTER TABLE advert
      DROP COLUMN IF EXISTS tsv;
    `)
  },
}
