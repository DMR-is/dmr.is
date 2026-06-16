'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- 1. Geography reference tables: region + postcode.
    --
    -- Iceland's postcodes (póstnúmer) roll up into eight regions
    -- (landshlutar). A company links to a postcode; its region is
    -- reached via company -> postcode -> region, so region is never
    -- stored on the company directly and can never drift.
    --
    -- The eight regions are seeded here (stable, rarely change). The
    -- canonical ~150-postcode set is loaded by a separate sourced
    -- seeder; this migration only creates the (empty) postcode table.
    -- region.code is the stable machine key that seeder resolves against.
    -- ============================================================

    CREATE TABLE region (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    INSERT INTO region (code, name) VALUES
      ('CAPITAL',           'Höfuðborgarsvæðið'),
      ('SUDURNES',          'Suðurnes'),
      ('VESTURLAND',        'Vesturland'),
      ('VESTFIRDIR',        'Vestfirðir'),
      ('NORDURLAND_VESTRA', 'Norðurland vestra'),
      ('NORDURLAND_EYSTRA', 'Norðurland eystra'),
      ('AUSTURLAND',        'Austurland'),
      ('SUDURLAND',         'Suðurland');

    CREATE TABLE postcode (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      code TEXT NOT NULL UNIQUE,
      place TEXT NOT NULL,
      region_id UUID NOT NULL REFERENCES region(id)
    );

    CREATE INDEX postcode_region_id_idx ON postcode (region_id);

    -- Canonical Icelandic postcodes, mapped to their landshluti. Regions are
    -- resolved by their stable code, so this does not depend on the generated
    -- region UUIDs. Cross-range calls worth noting: Vopnafjörður (690/691),
    -- Höfn í Hornafirði + Öræfi (780/781/785) -> Austurland; Siglufjörður
    -- (580/581) -> Norðurland eystra (Fjallabyggð); Flatey (345) -> Vesturland.
    INSERT INTO postcode (code, place, region_id)
    SELECT v.code, v.place, r.id
    FROM (VALUES
      ('101', 'Reykjavík', 'CAPITAL'),
      ('102', 'Reykjavík', 'CAPITAL'),
      ('103', 'Reykjavík', 'CAPITAL'),
      ('104', 'Reykjavík', 'CAPITAL'),
      ('105', 'Reykjavík', 'CAPITAL'),
      ('107', 'Reykjavík', 'CAPITAL'),
      ('108', 'Reykjavík', 'CAPITAL'),
      ('109', 'Reykjavík', 'CAPITAL'),
      ('110', 'Reykjavík', 'CAPITAL'),
      ('111', 'Reykjavík', 'CAPITAL'),
      ('112', 'Reykjavík', 'CAPITAL'),
      ('113', 'Reykjavík', 'CAPITAL'),
      ('116', 'Reykjavík', 'CAPITAL'),
      ('121', 'Reykjavík', 'CAPITAL'),
      ('123', 'Reykjavík', 'CAPITAL'),
      ('124', 'Reykjavík', 'CAPITAL'),
      ('125', 'Reykjavík', 'CAPITAL'),
      ('127', 'Reykjavík', 'CAPITAL'),
      ('128', 'Reykjavík', 'CAPITAL'),
      ('129', 'Reykjavík', 'CAPITAL'),
      ('130', 'Reykjavík', 'CAPITAL'),
      ('132', 'Reykjavík', 'CAPITAL'),
      ('161', 'Reykjavík', 'CAPITAL'),
      ('162', 'Reykjavík', 'CAPITAL'),
      ('170', 'Seltjarnarnes', 'CAPITAL'),
      ('172', 'Seltjarnarnes', 'CAPITAL'),
      ('190', 'Vogar', 'SUDURNES'),
      ('191', 'Vogar', 'SUDURNES'),
      ('200', 'Kópavogur', 'CAPITAL'),
      ('201', 'Kópavogur', 'CAPITAL'),
      ('202', 'Kópavogur', 'CAPITAL'),
      ('203', 'Kópavogur', 'CAPITAL'),
      ('206', 'Kópavogur', 'CAPITAL'),
      ('210', 'Garðabær', 'CAPITAL'),
      ('212', 'Garðabær', 'CAPITAL'),
      ('220', 'Hafnarfjörður', 'CAPITAL'),
      ('221', 'Hafnarfjörður', 'CAPITAL'),
      ('222', 'Hafnarfjörður', 'CAPITAL'),
      ('225', 'Garðabær', 'CAPITAL'),
      ('230', 'Reykjanesbær', 'SUDURNES'),
      ('232', 'Reykjanesbær', 'SUDURNES'),
      ('233', 'Reykjanesbær', 'SUDURNES'),
      ('235', 'Keflavíkurflugvöllur', 'SUDURNES'),
      ('240', 'Grindavík', 'SUDURNES'),
      ('241', 'Grindavík', 'SUDURNES'),
      ('245', 'Sandgerði', 'SUDURNES'),
      ('246', 'Sandgerði', 'SUDURNES'),
      ('250', 'Garður', 'SUDURNES'),
      ('251', 'Garður', 'SUDURNES'),
      ('260', 'Reykjanesbær', 'SUDURNES'),
      ('262', 'Reykjanesbær', 'SUDURNES'),
      ('270', 'Mosfellsbær', 'CAPITAL'),
      ('271', 'Mosfellsbær', 'CAPITAL'),
      ('276', 'Kjós', 'VESTURLAND'),
      ('300', 'Akranes', 'VESTURLAND'),
      ('301', 'Akranes', 'VESTURLAND'),
      ('302', 'Akranes', 'VESTURLAND'),
      ('310', 'Borgarnes', 'VESTURLAND'),
      ('311', 'Borgarnes', 'VESTURLAND'),
      ('320', 'Reykholt', 'VESTURLAND'),
      ('340', 'Stykkishólmur', 'VESTURLAND'),
      ('341', 'Stykkishólmur', 'VESTURLAND'),
      ('342', 'Stykkishólmur', 'VESTURLAND'),
      ('345', 'Flatey', 'VESTURLAND'),
      ('350', 'Grundarfjörður', 'VESTURLAND'),
      ('351', 'Grundarfjörður', 'VESTURLAND'),
      ('355', 'Ólafsvík', 'VESTURLAND'),
      ('356', 'Snæfellsbær', 'VESTURLAND'),
      ('360', 'Hellissandur', 'VESTURLAND'),
      ('370', 'Búðardalur', 'VESTURLAND'),
      ('371', 'Búðardalur', 'VESTURLAND'),
      ('380', 'Reykhólahreppur', 'VESTFIRDIR'),
      ('381', 'Reykhólahreppur', 'VESTFIRDIR'),
      ('400', 'Ísafjörður', 'VESTFIRDIR'),
      ('401', 'Ísafjörður', 'VESTFIRDIR'),
      ('410', 'Hnífsdalur', 'VESTFIRDIR'),
      ('415', 'Bolungarvík', 'VESTFIRDIR'),
      ('416', 'Bolungarvík', 'VESTFIRDIR'),
      ('420', 'Súðavík', 'VESTFIRDIR'),
      ('421', 'Súðavík', 'VESTFIRDIR'),
      ('425', 'Flateyri', 'VESTFIRDIR'),
      ('426', 'Flateyri', 'VESTFIRDIR'),
      ('430', 'Suðureyri', 'VESTFIRDIR'),
      ('431', 'Suðureyri', 'VESTFIRDIR'),
      ('450', 'Patreksfjörður', 'VESTFIRDIR'),
      ('451', 'Patreksfjörður', 'VESTFIRDIR'),
      ('460', 'Tálknafjörður', 'VESTFIRDIR'),
      ('461', 'Tálknafjörður', 'VESTFIRDIR'),
      ('465', 'Bíldudalur', 'VESTFIRDIR'),
      ('466', 'Bíldudalur', 'VESTFIRDIR'),
      ('470', 'Þingeyri', 'VESTFIRDIR'),
      ('471', 'Þingeyri', 'VESTFIRDIR'),
      ('500', 'Staður', 'VESTFIRDIR'),
      ('510', 'Hólmavík', 'VESTFIRDIR'),
      ('511', 'Hólmavík', 'VESTFIRDIR'),
      ('512', 'Hólmavík', 'VESTFIRDIR'),
      ('520', 'Drangsnes', 'VESTFIRDIR'),
      ('524', 'Árneshreppur', 'VESTFIRDIR'),
      ('530', 'Hvammstangi', 'NORDURLAND_VESTRA'),
      ('531', 'Hvammstangi', 'NORDURLAND_VESTRA'),
      ('540', 'Blönduós', 'NORDURLAND_VESTRA'),
      ('541', 'Blönduós', 'NORDURLAND_VESTRA'),
      ('545', 'Skagaströnd', 'NORDURLAND_VESTRA'),
      ('546', 'Skagaströnd', 'NORDURLAND_VESTRA'),
      ('550', 'Sauðárkrókur', 'NORDURLAND_VESTRA'),
      ('551', 'Sauðárkrókur', 'NORDURLAND_VESTRA'),
      ('560', 'Varmahlíð', 'NORDURLAND_VESTRA'),
      ('561', 'Varmahlíð', 'NORDURLAND_VESTRA'),
      ('565', 'Hofsós', 'NORDURLAND_VESTRA'),
      ('566', 'Hofsós', 'NORDURLAND_VESTRA'),
      ('570', 'Fljót', 'NORDURLAND_VESTRA'),
      ('580', 'Siglufjörður', 'NORDURLAND_EYSTRA'),
      ('581', 'Siglufjörður', 'NORDURLAND_EYSTRA'),
      ('600', 'Akureyri', 'NORDURLAND_EYSTRA'),
      ('601', 'Akureyri', 'NORDURLAND_EYSTRA'),
      ('602', 'Akureyri', 'NORDURLAND_EYSTRA'),
      ('603', 'Akureyri', 'NORDURLAND_EYSTRA'),
      ('604', 'Akureyri', 'NORDURLAND_EYSTRA'),
      ('605', 'Akureyri', 'NORDURLAND_EYSTRA'),
      ('606', 'Akureyri', 'NORDURLAND_EYSTRA'),
      ('607', 'Akureyri', 'NORDURLAND_EYSTRA'),
      ('610', 'Grenivík', 'NORDURLAND_EYSTRA'),
      ('611', 'Grímsey', 'NORDURLAND_EYSTRA'),
      ('616', 'Grenivík', 'NORDURLAND_EYSTRA'),
      ('620', 'Dalvík', 'NORDURLAND_EYSTRA'),
      ('621', 'Dalvík', 'NORDURLAND_EYSTRA'),
      ('625', 'Ólafsfjörður', 'NORDURLAND_EYSTRA'),
      ('626', 'Ólafsfjörður', 'NORDURLAND_EYSTRA'),
      ('630', 'Hrísey', 'NORDURLAND_EYSTRA'),
      ('640', 'Húsavík', 'NORDURLAND_EYSTRA'),
      ('641', 'Húsavík', 'NORDURLAND_EYSTRA'),
      ('645', 'Fosshóll', 'NORDURLAND_EYSTRA'),
      ('650', 'Laugar', 'NORDURLAND_EYSTRA'),
      ('660', 'Mývatn', 'NORDURLAND_EYSTRA'),
      ('670', 'Kópasker', 'NORDURLAND_EYSTRA'),
      ('671', 'Kópasker', 'NORDURLAND_EYSTRA'),
      ('675', 'Raufarhöfn', 'NORDURLAND_EYSTRA'),
      ('676', 'Raufarhöfn', 'NORDURLAND_EYSTRA'),
      ('680', 'Þórshöfn', 'NORDURLAND_EYSTRA'),
      ('681', 'Þórshöfn', 'NORDURLAND_EYSTRA'),
      ('685', 'Bakkafjörður', 'NORDURLAND_EYSTRA'),
      ('686', 'Bakkafjörður', 'NORDURLAND_EYSTRA'),
      ('690', 'Vopnafjörður', 'AUSTURLAND'),
      ('691', 'Vopnafjörður', 'AUSTURLAND'),
      ('700', 'Egilsstaðir', 'AUSTURLAND'),
      ('701', 'Egilsstaðir', 'AUSTURLAND'),
      ('710', 'Seyðisfjörður', 'AUSTURLAND'),
      ('711', 'Seyðisfjörður', 'AUSTURLAND'),
      ('715', 'Mjóifjörður', 'AUSTURLAND'),
      ('720', 'Borgarfjörður eystri', 'AUSTURLAND'),
      ('721', 'Borgarfjörður eystri', 'AUSTURLAND'),
      ('730', 'Reyðarfjörður', 'AUSTURLAND'),
      ('731', 'Reyðarfjörður', 'AUSTURLAND'),
      ('735', 'Eskifjörður', 'AUSTURLAND'),
      ('736', 'Eskifjörður', 'AUSTURLAND'),
      ('740', 'Neskaupstaður', 'AUSTURLAND'),
      ('741', 'Neskaupstaður', 'AUSTURLAND'),
      ('750', 'Fáskrúðsfjörður', 'AUSTURLAND'),
      ('751', 'Fáskrúðsfjörður', 'AUSTURLAND'),
      ('755', 'Stöðvarfjörður', 'AUSTURLAND'),
      ('756', 'Stöðvarfjörður', 'AUSTURLAND'),
      ('760', 'Breiðdalsvík', 'AUSTURLAND'),
      ('761', 'Breiðdalsvík', 'AUSTURLAND'),
      ('765', 'Djúpivogur', 'AUSTURLAND'),
      ('766', 'Djúpivogur', 'AUSTURLAND'),
      ('780', 'Höfn í Hornafirði', 'AUSTURLAND'),
      ('781', 'Höfn í Hornafirði', 'AUSTURLAND'),
      ('785', 'Öræfi', 'AUSTURLAND'),
      ('800', 'Selfoss', 'SUDURLAND'),
      ('801', 'Selfoss', 'SUDURLAND'),
      ('802', 'Selfoss', 'SUDURLAND'),
      ('803', 'Selfoss', 'SUDURLAND'),
      ('804', 'Selfoss', 'SUDURLAND'),
      ('805', 'Selfoss', 'SUDURLAND'),
      ('806', 'Selfoss', 'SUDURLAND'),
      ('810', 'Hveragerði', 'SUDURLAND'),
      ('815', 'Þorlákshöfn', 'SUDURLAND'),
      ('816', 'Ölfus', 'SUDURLAND'),
      ('820', 'Eyrarbakki', 'SUDURLAND'),
      ('825', 'Stokkseyri', 'SUDURLAND'),
      ('840', 'Laugarvatn', 'SUDURLAND'),
      ('845', 'Flúðir', 'SUDURLAND'),
      ('846', 'Flúðir', 'SUDURLAND'),
      ('850', 'Hella', 'SUDURLAND'),
      ('851', 'Hella', 'SUDURLAND'),
      ('860', 'Hvolsvöllur', 'SUDURLAND'),
      ('861', 'Hvolsvöllur', 'SUDURLAND'),
      ('870', 'Vík', 'SUDURLAND'),
      ('871', 'Vík', 'SUDURLAND'),
      ('880', 'Kirkjubæjarklaustur', 'SUDURLAND'),
      ('881', 'Kirkjubæjarklaustur', 'SUDURLAND'),
      ('900', 'Vestmannaeyjar', 'SUDURLAND'),
      ('902', 'Vestmannaeyjar', 'SUDURLAND')
    ) AS v(code, place, region_code)
    JOIN region r ON r.code = v.region_code;

    -- ============================================================
    -- 2. Company lifecycle status + address.
    --
    -- Companies gain an ACTIVE/INACTIVE status (defaulting to ACTIVE
    -- for every existing row), a free-text street address, and a FK to
    -- their postcode. City/place comes from postcode.place; region from
    -- postcode.region_id — neither is duplicated on the company. Status
    -- transitions are recorded on company_event below, so this column
    -- only ever holds the *current* status.
    -- ============================================================

    CREATE TYPE company_status_enum AS ENUM ('ACTIVE', 'INACTIVE');

    ALTER TABLE company
      ADD COLUMN status company_status_enum NOT NULL DEFAULT 'ACTIVE',
      ADD COLUMN address TEXT DEFAULT NULL,
      ADD COLUMN postcode_id UUID DEFAULT NULL REFERENCES postcode(id);

    CREATE INDEX company_postcode_id_idx ON company (postcode_id);

    -- ============================================================
    -- 3. Company timeline events.
    --
    -- Immutable, append-only. Mirrors report_event but scoped to the
    -- company lifecycle. STATUS_CHANGED rows carry from/to status and
    -- an optional reason (e.g. bankruptcy, merger) — this is the
    -- explorable status history; no separate history table is needed.
    -- ============================================================

    CREATE TYPE company_event_type_enum AS ENUM ('STATUS_CHANGED');

    CREATE TABLE company_event (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      company_id UUID NOT NULL REFERENCES company(id),
      event_type company_event_type_enum NOT NULL,
      actor_user_id UUID DEFAULT NULL REFERENCES doe_user(id),
      status company_status_enum NOT NULL,
      from_status company_status_enum DEFAULT NULL,
      to_status company_status_enum DEFAULT NULL,
      reason TEXT DEFAULT NULL,

      CONSTRAINT company_event_status_changed_chk CHECK (
        event_type <> 'STATUS_CHANGED' OR (
          from_status IS NOT NULL
          AND to_status IS NOT NULL
          AND status = to_status
        )
      )
    );

    -- ============================================================
    -- 4. Company comments.
    --
    -- Reviewer-internal notes an admin can leave on a company. No
    -- visibility dimension (companies never see these) and no
    -- author-kind — the author is always an admin doe_user. Paranoid
    -- (soft delete) so the timeline stays auditable.
    -- ============================================================

    CREATE TABLE company_comment (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ DEFAULT NULL,

      company_id UUID NOT NULL REFERENCES company(id),
      author_user_id UUID DEFAULT NULL REFERENCES doe_user(id),
      body TEXT NOT NULL
    );

    -- ============================================================
    -- 5. Indexes (timeline + FK lookups).
    -- ============================================================

    CREATE INDEX company_event_company_id_idx
      ON company_event (company_id);
    CREATE INDEX company_event_actor_user_id_idx
      ON company_event (actor_user_id);
    CREATE INDEX company_event_timeline_idx
      ON company_event (company_id, created_at);

    CREATE INDEX company_comment_company_id_idx
      ON company_comment (company_id);
    CREATE INDEX company_comment_author_user_id_idx
      ON company_comment (author_user_id);
    CREATE INDEX company_comment_timeline_idx
      ON company_comment (company_id, created_at)
      WHERE deleted_at IS NULL;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DROP TABLE IF EXISTS company_comment;
    DROP TABLE IF EXISTS company_event;

    ALTER TABLE company
      DROP COLUMN IF EXISTS postcode_id,
      DROP COLUMN IF EXISTS address,
      DROP COLUMN IF EXISTS status;

    DROP TYPE IF EXISTS company_event_type_enum;
    DROP TYPE IF EXISTS company_status_enum;

    DROP TABLE IF EXISTS postcode;
    DROP TABLE IF EXISTS region;

    COMMIT;
    `)
  },
}
