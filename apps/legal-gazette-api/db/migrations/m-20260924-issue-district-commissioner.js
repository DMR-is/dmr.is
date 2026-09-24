'use strict'

/**
 * The daily issue PDF prints DISTRICT_COMMISSIONER as útgefandi og
 * ábyrgðarmaður. The office changed hands, so the name on every issue from
 * now on is Anna Lilja Ragnarsdóttir.
 *
 * Only the settings row changes. Issues already generated keep the name they
 * were printed with.
 */

const PREVIOUS = 'Kristín Þórðardóttir'
const CURRENT = 'Anna Lilja Ragnarsdóttir'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      UPDATE DOCUMENT_ISSUE_SETTINGS
      SET
        DISTRICT_COMMISSIONER = '${CURRENT}',
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE DISTRICT_COMMISSIONER = '${PREVIOUS}'
        AND DELETED_AT IS NULL;

      COMMIT;
    `)
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      UPDATE DOCUMENT_ISSUE_SETTINGS
      SET
        DISTRICT_COMMISSIONER = '${PREVIOUS}',
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE DISTRICT_COMMISSIONER = '${CURRENT}'
        AND DELETED_AT IS NULL;

      COMMIT;
    `)
  },
}
