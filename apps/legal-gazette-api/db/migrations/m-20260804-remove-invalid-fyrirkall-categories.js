'use strict'

/**
 * The type "Fyrirkall" was assignable to three categories, which made the
 * "first category of a type" heuristic resolve it to "Áskoranir" (categories are
 * ordered by title, and Áskoranir sorts before Fyrirköll og ákærur).
 *
 * The published mapping in the public web (sidur/auglysingaflokkar) lists
 * Fyrirkall under "Fyrirköll og ákærur" only, and every historic Fyrirkall
 * advert uses that category, so the other two rows are data defects.
 *
 * Adverts store type_id and category_id as independent columns, so removing
 * these join rows does not change any existing advert.
 */

const FYRIRKALL_TYPE_ID = 'E35498BE-DA79-41D1-A2A0-CBEF3A51331C'
const ASKORANIR_CATEGORY_ID = 'C3B48892-AC9D-48D4-903A-26F21083143E'
const YMSAR_CATEGORY_ID = '2AC37319-990A-4C40-9383-CAC74BBCB15F'

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      DELETE FROM TYPE_CATEGORIES
      WHERE TYPE_ID = '${FYRIRKALL_TYPE_ID}'
        AND CATEGORY_ID IN (
          '${ASKORANIR_CATEGORY_ID}',
          '${YMSAR_CATEGORY_ID}'
        );

      COMMIT;
    `)
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      INSERT INTO
        TYPE_CATEGORIES (type_id, category_id)
      VALUES
        ('${FYRIRKALL_TYPE_ID}', '${ASKORANIR_CATEGORY_ID}'),
        ('${FYRIRKALL_TYPE_ID}', '${YMSAR_CATEGORY_ID}')
      ON CONFLICT (type_id, category_id) DO NOTHING;

      COMMIT;
    `)
  },
}
