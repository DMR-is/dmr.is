INSERT INTO
  USER_ROLE (ID, TITLE, SLUG)
VALUES
  (
    '66f472c1-f133-48ba-a74b-318e1920dc24',
    'Ritstjóri',
    'ritstjori'
  );

INSERT INTO
  USER_ROLE (ID, TITLE, SLUG)
VALUES
  (
    'e75f1c59-d572-4126-b5ee-f29f7498c59a',
    'Fulltrúi',
    'fulltrui'
  );

INSERT INTO
  USER_ROLE (ID, TITLE, SLUG)
VALUES
  (
    '126d07e7-d3c4-41c7-8178-445028e4dc0f',
    'Innsendandi',
    'innsendandi'
  );

INSERT INTO
  OJOI_USER (
    ID,
    NATIONAL_ID,
    FIRST_NAME,
    LAST_NAME,
    DISPLAY_NAME,
    EMAIL,
    DELETED,
    CREATED,
    UPDATED
  )
VALUES
  (
    'a235bb11-65e5-4bbd-a99a-f5773380e79d',
    '0101302719',
    'Gervimaður',
    'Evrópa',
    'GM Evrópa',
    'gm@evropa.is',
    false,
    '2024-10-02T14:11:01.646Z',
    '2024-10-02T14:11:01.646Z'
  );

INSERT INTO
  OJOI_USER (
    ID,
    NATIONAL_ID,
    FIRST_NAME,
    LAST_NAME,
    DISPLAY_NAME,
    EMAIL,
    DELETED,
    CREATED,
    UPDATED
  )
VALUES
  (
    'db710b5d-8745-4f5f-b22b-c7151847c56a',
    '0101307789',
    'Gervimaður',
    'Útlönd',
    'GM Útlönd',
    'gm@utlond.IS',
    false,
    '2024-10-02T14:11:01.646Z',
    '2024-10-02T14:11:01.646Z'
  );

INSERT INTO
  OJOI_USER (
    ID,
    NATIONAL_ID,
    FIRST_NAME,
    LAST_NAME,
    DISPLAY_NAME,
    EMAIL,
    DELETED,
    CREATED,
    UPDATED
  )
VALUES
  (
    '115e5c5d-e257-4e9a-ad57-e26f4bb890ef',
    '0101302399',
    'Gervimaður',
    'Færeyjar',
    'GM Færeyjar',
    'gm@faereyjar.is',
    false,
    '2024-10-02T14:11:01.646Z',
    '2024-10-02T14:11:01.646Z'
  );

INSERT INTO
  USER_ROLES (USER_ROLE_ID, USER_ID)
VALUES
  (
    '66f472c1-f133-48ba-a74b-318e1920dc24',
    '115e5c5d-e257-4e9a-ad57-e26f4bb890ef'
  );

INSERT INTO
  USER_ROLES (USER_ROLE_ID, USER_ID)
VALUES
  (
    'e75f1c59-d572-4126-b5ee-f29f7498c59a',
    'db710b5d-8745-4f5f-b22b-c7151847c56a'
  );

INSERT INTO
  USER_ROLES (USER_ROLE_ID, USER_ID)
VALUES
  (
    '126d07e7-d3c4-41c7-8178-445028e4dc0f',
    'a235bb11-65e5-4bbd-a99a-f5773380e79d'
  );

INSERT INTO
  USER_INVOLVED_PARTIES (USER_ID, INVOLVED_PARTY_ID)
VALUES
  (
    'db710b5d-8745-4f5f-b22b-c7151847c56a',
    'C095A02B-A699-46E5-A896-3195FBB22D65'
  );

INSERT INTO
  USER_INVOLVED_PARTIES (USER_ID, INVOLVED_PARTY_ID)
VALUES
  (
    'a235bb11-65e5-4bbd-a99a-f5773380e79d',
    'C095A02B-A699-46E5-A896-3195FBB22D65'
  );