'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Enable trigram extension if not already enabled
      CREATE EXTENSION IF NOT EXISTS pg_trgm;

      -- Index for national ID lookups (exact match)
      CREATE INDEX IF NOT EXISTS idx_advert_created_by_national_id
        ON ADVERT(CREATED_BY_NATIONAL_ID)
        WHERE CREATED_BY_NATIONAL_ID IS NOT NULL;

      -- Index for publication number lookups (exact match)
      CREATE INDEX IF NOT EXISTS idx_advert_publication_number
        ON ADVERT(PUBLICATION_NUMBER)
        WHERE PUBLICATION_NUMBER IS NOT NULL;

      -- Indexes for text search across multiple fields
      CREATE INDEX IF NOT EXISTS idx_advert_title_trgm
        ON ADVERT USING gin(TITLE gin_trgm_ops);

      CREATE INDEX IF NOT EXISTS idx_advert_content_trgm
        ON ADVERT USING gin(CONTENT gin_trgm_ops);

      CREATE INDEX IF NOT EXISTS idx_advert_additional_text_trgm
        ON ADVERT USING gin(ADDITIONAL_TEXT gin_trgm_ops);

      CREATE INDEX IF NOT EXISTS idx_advert_created_by_trgm
        ON ADVERT USING gin(CREATED_BY gin_trgm_ops);

      CREATE INDEX IF NOT EXISTS idx_advert_caption_trgm
        ON ADVERT USING gin(CAPTION gin_trgm_ops);

      -- Composite index for publication sorting optimization
      CREATE INDEX IF NOT EXISTS idx_advert_publication_sorting
        ON ADVERT_PUBLICATION(ADVERT_ID, PUBLISHED_AT, SCHEDULED_AT);

      -- Partial index for fast lookup of unpublished publications (next scheduled)
      CREATE INDEX IF NOT EXISTS idx_advert_publication_unpublished
        ON ADVERT_PUBLICATION(ADVERT_ID, SCHEDULED_AT)
        WHERE PUBLISHED_AT IS NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS idx_advert_created_by_national_id;
      DROP INDEX IF EXISTS idx_advert_publication_number;
      DROP INDEX IF EXISTS idx_advert_title_trgm;
      DROP INDEX IF EXISTS idx_advert_content_trgm;
      DROP INDEX IF EXISTS idx_advert_additional_text_trgm;
      DROP INDEX IF EXISTS idx_advert_created_by_trgm;
      DROP INDEX IF EXISTS idx_advert_caption_trgm;
      DROP INDEX IF EXISTS idx_advert_publication_sorting;
      DROP INDEX IF EXISTS idx_advert_publication_unpublished;

      COMMIT;
    `)
  },
}
