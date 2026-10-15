'use strict'

/**
 * Moves byggðasamlög out of `SVEITARFELAG` and into `FYRIRTAEKI`.
 *
 * A byggðasamlag (Strætó bs., SORPA bs., …) is not a municipality. It files on
 * its own, as an employer in its own right, and the Directorate's register
 * already files every one of them as FYRIRTAEKI. Since m-20261015,
 * SVEITARFELAG also waives the equality precondition on a salary filing, which
 * byggðasamlög do not get, so a byggðasamlag left there would be exempt.
 *
 * `LEGAL_FORM_SECTOR` now maps an RSK `byggdasamlag` to FYRIRTAEKI, so new rows
 * land correctly. This fixes existing rows: m-20260915 moved PUBLIC rows with a
 * `bygg%` legal form into SVEITARFELAG, and the RSK lookup paths wrote it until
 * now. The match is the same as m-20260915's, on both columns independently
 * and on a prefix that stops before the ð.
 *
 * Rows an admin classified by hand (`sector_override = true`) are left alone,
 * as every sector rewrite does.
 *
 * `down` is a no-op. Nothing records which rows this moved, and putting every
 * FYRIRTAEKI byggðasamlag into SVEITARFELAG would also move the ones the
 * register loaded there, which were never SVEITARFELAG.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE company
      SET sector = 'FYRIRTAEKI', updated_at = now()
      WHERE sector = 'SVEITARFELAG'
        AND sector_override = false
        AND (
          lower(coalesce(legal_form_id, '')) LIKE 'bygg%'
          OR lower(coalesce(legal_form_name, '')) LIKE 'bygg%'
        );
    `)
  },

  async down() {
    // Deliberately a no-op. Nothing records which rows `up` moved, so there is
    // no way to put back exactly those — see the header.
  },
}
