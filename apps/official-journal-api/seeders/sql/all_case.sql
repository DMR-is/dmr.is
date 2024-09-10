INSERT INTO
  case_status (id, key, value)
VALUES
  (
    '799722be-5530-439a-91dc-606e129b030d',
    'Submitted',
    'Innsent'
  );

INSERT INTO
  case_status (id, key, value)
VALUES
  (
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    'InProgress',
    'Grunnvinnsla'
  );

INSERT INTO
  case_status (id, key, value)
VALUES
  (
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    'InReview',
    'Yfirlestur'
  );

INSERT INTO
  case_status (id, key, value)
VALUES
  (
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    'ReadyForPublishing',
    'Tilbúið'
  );

INSERT INTO
  case_status (id, key, value)
VALUES
  (
    'cd1536de-4481-492f-8db1-1ea0e3e38880',
    'Published',
    'Útgefið'
  );

INSERT INTO
  case_status (id, key, value)
VALUES
  (
    'c2b24d63-e5d9-417f-8ec1-ef5150e1a17f',
    'Unpublished',
    'Tekið úr birtingu'
  );

INSERT INTO
  case_status (id, key, value)
VALUES
  (
    'a8668645-ef72-4f2d-8e75-7bfe65b0123c',
    'Rejected',
    'Birtingu hafnað'
  );

INSERT INTO
  case_tag (id, key, value)
VALUES
  (
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    'NotStarted',
    'Ekki hafið'
  );

INSERT INTO
  case_tag (id, key, value)
VALUES
  (
    '480853f2-a511-41b5-b663-df655741e77a',
    'InReview',
    'Í yfirlestri'
  );

INSERT INTO
  case_tag (id, key, value)
VALUES
  (
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    'MultipleReviewers',
    'Samlesin'
  );

INSERT INTO
  case_tag (id, key, value)
VALUES
  (
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'RequiresReview',
    'Þarf skoðun'
  );

INSERT INTO
  case_communication_status (id, key, value)
VALUES
  (
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    'NotStarted',
    'Ekki hafin'
  );

INSERT INTO
  case_communication_status (id, key, value)
VALUES
  (
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    'WaitingForAnswers',
    'Beðið eftir svörum'
  );

INSERT INTO
  case_communication_status (id, key, value)
VALUES
  (
    'a253814d-2ef5-4321-96ff-301967b6509b',
    'HasAnswers',
    'Svör hafa borist'
  );

INSERT INTO
  case_communication_status (id, key, value)
VALUES
  (
    '904d562b-079c-4419-8019-c054fb422892',
    'Done',
    'Lokið'
  );

INSERT INTO
  case_comment_title (id, key, value)
VALUES
  (
    'd1e1377d-2d01-4a5a-999f-cdb1ec0cfc17',
    'Submit',
    'Innsent af:'
  );

INSERT INTO
  case_comment_title (id, key, value)
VALUES
  (
    'cf8ce92b-8838-4a76-8fb3-956ce35bca3b',
    'AssignSelf',
    'merkir sér málið.'
  );

INSERT INTO
  case_comment_title (id, key, value)
VALUES
  (
    'bad8a244-9f02-4799-a3fc-bf652f6cf7fd',
    'Assign',
    'færir mál á'
  );

INSERT INTO
  case_comment_title (id, key, value)
VALUES
  (
    '84237319-b317-4ac4-a4cf-724b5d9bbed6',
    'UpdateStatus',
    'færir mál í stöðuna:'
  );

INSERT INTO
  case_comment_title (id, key, value)
VALUES
  (
    '72dbba56-6808-4344-883f-48e67783ab49',
    'Comment',
    'gerir athugasemd.'
  );

INSERT INTO
  case_comment_title (id, key, value)
VALUES
  (
    'a303587f-7cad-4f43-960d-e66d094a28b5',
    'Message',
    'skráir skilaboð'
  );

INSERT INTO
  case_comment_type (id, key, value)
VALUES
  (
    '6c28e8ff-63f6-4cfc-81f0-2835def7d021',
    'Submit',
    'submit'
  );

INSERT INTO
  case_comment_type (id, key, value)
VALUES
  (
    'be3b0ccd-51c8-4e96-8957-485bc35c8568',
    'Assign',
    'assign'
  );

INSERT INTO
  case_comment_type (id, key, value)
VALUES
  (
    '6c296957-6aab-447a-9706-9c3d54d0f03d',
    'Assign',
    'assign_self'
  );

INSERT INTO
  case_comment_type (id, key, value)
VALUES
  (
    'e34f7bf2-a7e7-4147-9b8b-1ca232f26952',
    'Update',
    'update'
  );

INSERT INTO
  case_comment_type (id, key, value)
VALUES
  (
    '755b2a15-9a64-41ef-a53e-b73688d71440',
    'Comment',
    'comment'
  );

INSERT INTO
  case_comment_type (id, key, value)
VALUES
  (
    '771cffc9-cc84-42a4-8b06-6ef51ee489e4',
    'Message',
    'message'
  );

INSERT INTO
  signature_type (id, title, slug)
VALUES
  (
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    'Hefðbundin undirritun',
    'hefdbundin-undirritun'
  );

INSERT INTO
  signature_type (id, title, slug)
VALUES
  (
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    'Undirritun nefndar',
    'undirritun-nefndar'
  );

INSERT INTO
  application_attachment_type(id, title, slug)
VALUES
  (
    '822dc306-bafd-4fdf-82f9-ef194142f72a',
    'Frumrit',
    'frumrit'
  );

INSERT INTO
  application_attachment_type(id, title, slug)
VALUES
  (
    '6cdd170a-2274-4f3c-a3b5-829602793455',
    'Fylgiskjöl',
    'fylgiskjol'
  );