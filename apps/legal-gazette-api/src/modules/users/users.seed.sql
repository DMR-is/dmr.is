INSERT INTO
  LEGAL_GAZETTE_USER_ROLES (id, title, slug)
VALUES
  (
    'aad4aadb-0924-4a66-b852-e8b9a01b022d',
    'ADMIN',
    'admin'
  ),
  (
    '93bc4ffa-d3c2-4519-abd2-5f4bcbad700e',
    'USER',
    'user'
  );

INSERT INTO
  LEGAL_GAZETTE_USERS (
    id,
    national_id,
    first_name,
    last_name,
    email,
    phone,
    user_role_id
  )
VALUES
  (
    'b4e98cee-a4d8-4924-90df-b820c4bc0801',
    '0101302399',
    'Gervimaður',
    'Færeyjar',
    'gm@faereyjar.is',
    '555-1234',
    'aad4aadb-0924-4a66-b852-e8b9a01b022d'
  );
