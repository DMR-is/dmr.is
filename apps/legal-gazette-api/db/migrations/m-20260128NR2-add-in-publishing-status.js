'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- FIRST WE CREATE THE NEW STATUS MADE FOR ADVERTS WHERE NOT ALL PUBLICATIONS HAVE BEEN PUBLISHED YET

      INSERT INTO ADVERT_STATUS (ID, TITLE, SLUG) VALUES (
        '5d1561dc-693c-4682-9b70-03b664d65d9b',
        'Í útgáfu',
        'i-utgafu'
      );

      -- MARK ALL THE ADVERTS THAT HAVE AT LEAST ONE PUBLICATION PUBLISHED AND AT LEAST ONE NOT PUBLISHED WITH THE NEW STATUS

      UPDATE ADVERT
      SET
        ADVERT_STATUS_ID = '5d1561dc-693c-4682-9b70-03b664d65d9b'
      WHERE
        ID IN (
          SELECT
            A.ID
          FROM
            ADVERT A
          WHERE
            EXISTS (
              SELECT
                1
              FROM
                ADVERT_PUBLICATION AP
              WHERE
                AP.ADVERT_ID = A.ID
                AND AP.PUBLISHED_AT IS NOT NULL
            )
            AND EXISTS (
              SELECT
                1
              FROM
                ADVERT_PUBLICATION AP
              WHERE
                AP.ADVERT_ID = A.ID
                AND AP.PUBLISHED_AT IS NULL
            )
        );


      COMMIT;
    `)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`

      BEGIN;

      -- FIRST WE RESET THE STATUS OF ALL THE ADVERTS THAT WERE MARKED AS 'Í ÚTGÁFU' TO 'ÚTGEFIÐ'

      UPDATE ADVERT
      SET
        ADVERT_STATUS_ID = 'bd835a1d-0ecb-4aa4-9910-b5e60c30dced'  -- Útgefið
      WHERE
        ADVERT_STATUS_ID = '5d1561dc-693c-4682-9b70-03b664d65d9b'; -- Í útgáfu

      -- THEN WE DELETE THE 'Í ÚTGÁFU' STATUS FROM THE ADVERT_STATUS TABLE

      -- SOFT DELETE
      UPDATE ADVERT_STATUS
      SET
        DELETED_AT = NOW()
      WHERE
        ID = '5d1561dc-693c-4682-9b70-03b664d65d9b';


      COMMIT;
    `)
  },
}
