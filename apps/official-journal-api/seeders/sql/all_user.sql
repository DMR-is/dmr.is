INSERT INTO
  USER_ROLE (ID, TITLE, SLUG)
VALUES
  (
    '66f472c1-f133-48ba-a74b-318e1920dc24',
    'Admin',
    'admin'
  );

INSERT INTO
  USER_ROLE (ID, TITLE, SLUG)
VALUES
  (
    'e75f1c59-d572-4126-b5ee-f29f7498c59a',
    'Editor',
    'editor'
  );

INSERT INTO
  ADMIN_USER (
    ID,
    NATIONAL_ID,
    FIRST_NAME,
    LAST_NAME,
    DISPLAY_NAME,
    EMAIL,
    CREATED,
    UPDATED
  )
VALUES
  (
    'f450279c-b07e-4f92-a5ae-d8f93360cafe',
    '0101857799',
    'Ármann Árni',
    'Gunnarsson',
    'Ármann Árni',
    'armann.arni@testuser.com'
    '2024-10-02T14:11:01.646Z',
    '2024-10-02T14:11:01.646Z'
  );

INSERT INTO
  ADMIN_USER (
    ID,
    NATIONAL_ID,
    FIRST_NAME,
    LAST_NAME,
    DISPLAY_NAME,
    EMAIL,
    CREATED,
    UPDATED
  )
VALUES
  (
    'db710b5d-8745-4f5f-b22b-c7151847c56a',
    '0101876689',
    'Pálína J',
    'Þórhildardóttir',
    'Pálína J',
    'palina.j@testuser.com'
    '2024-10-02T14:11:01.646Z',
    '2024-10-02T14:11:01.646Z'
  );

INSERT INTO
  ADMIN_USER (
    ID,
    NATIONAL_ID,
    FIRST_NAME,
    LAST_NAME,
    DISPLAY_NAME,
    EMAIL,
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
    'gm@faereyjar.is'
    '2024-10-02T14:11:01.646Z',
    '2024-10-02T14:11:01.646Z'
  );

INSERT INTO
  ADMIN_USER_ROLES (USER_ROLE_ID, ADMIN_USER_ID)
VALUES
  (
    '66f472c1-f133-48ba-a74b-318e1920dc24',
    '115e5c5d-e257-4e9a-ad57-e26f4bb890ef'
  );

INSERT INTO
  ADMIN_USER_ROLES (USER_ROLE_ID, ADMIN_USER_ID)
VALUES
  (
    '66f472c1-f133-48ba-a74b-318e1920dc24',
    'f450279c-b07e-4f92-a5ae-d8f93360cafe'
  );

INSERT INTO
  ADMIN_USER_ROLES (USER_ROLE_ID, ADMIN_USER_ID)
VALUES
  (
    '66f472c1-f133-48ba-a74b-318e1920dc24',
    'db710b5d-8745-4f5f-b22b-c7151847c56a'
  );

INSERT INTO
  APPLICATION_USER (
    ID,
    NATIONAL_ID,
    FIRST_NAME,
    LAST_NAME,
    EMAIL,
    PHONE
  )
VALUES
  (
    'f93461d3-7667-4e7b-86b9-83b4f1f97592',
    '0101307789',
    'Gervimaður',
    'Útlönd',
    NULL,
    NULL
  );

INSERT INTO
  APPLICATION_USER_INVOLVED_PARTIES (APPLICATION_USER_ID, INVOLVED_PARTY_ID)
VALUES
  (
    'f93461d3-7667-4e7b-86b9-83b4f1f97592',
    'E5A35CF9-DC87-4DA7-85A2-06EB5D43812F'
  );

INSERT INTO
  APPLICATION_USER_INVOLVED_PARTIES (APPLICATION_USER_ID, INVOLVED_PARTY_ID)
VALUES
  (
    'f93461d3-7667-4e7b-86b9-83b4f1f97592',
    'a2a33c95-45ce-4540-bd56-12d964b7699b'
  );
