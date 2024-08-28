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
    'Frumit',
    'frumit'
  );

INSERT INTO
  application_attachment_type(id, title, slug)
VALUES
  (
    '6cdd170a-2274-4f3c-a3b5-829602793455',
    'Fylgiskjöl',
    'fylgiskjol'
  )
INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'e03bb7f7-632f-4077-966e-be0e7814ba99',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202402012',
    '799722be-5530-439a-91dc-606e129b030d',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '685775AC-858C-4E36-BCDF-7ED340507656',
    '2024-02-12T02:08:05.160Z',
    '2024-02-12T02:08:05.160Z',
    false,
    NULL,
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '637291f2-f7f4-405d-8586-ef88b59cab00',
    'c219e135-f343-4e90-afe3-913efe0c86ce',
    'um breytingu á prófareglum fyrir Háskólann á Akureyri.',
    '2024-02-22T10:49:43.300Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'e03bb7f7-632f-4077-966e-be0e7814ba99',
    '619EFD7B-DE81-4985-9D0B-45EF809BA9A7'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'e03bb7f7-632f-4077-966e-be0e7814ba99',
    '158D043B-8F90-40C7-B984-6E40EB5A4F39'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'e03bb7f7-632f-4077-966e-be0e7814ba99',
    '6586A5B6-DD8F-4550-B465-FE19385FE7EA'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'e03bb7f7-632f-4077-966e-be0e7814ba99',
    'DE8AC9BA-DF73-4353-A353-0E7F2D843D36'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'e03bb7f7-632f-4077-966e-be0e7814ba99',
    'E5F49B58-B742-4944-B767-03AD6FA156CA'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'c94a338b-d8b9-49ed-94bb-c0e0229b3897',
    'Bryndís Perla Björnsdóttir',
    NULL,
    NULL,
    'Bankaráðsmaður'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '9ccb3967-1c14-4626-854a-a544e5b27081',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2024-02-12T02:08:05.160Z',
    'Samgöngustofa',
    '685775AC-858C-4E36-BCDF-7ED340507656',
    'c94a338b-d8b9-49ed-94bb-c0e0229b3897',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '9ccb3967-1c14-4626-854a-a544e5b27081',
    'c94a338b-d8b9-49ed-94bb-c0e0229b3897'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'e03bb7f7-632f-4077-966e-be0e7814ba99',
    '9ccb3967-1c14-4626-854a-a544e5b27081'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'b3b046a6-cf44-4cb7-959f-c84e16a59431',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202308028',
    '799722be-5530-439a-91dc-606e129b030d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'AE0CDA19-8832-4F11-A2B7-6F5966A54C4D',
    '2023-08-28T01:07:54.692Z',
    '2023-08-28T01:07:54.692Z',
    false,
    NULL,
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '637291f2-f7f4-405d-8586-ef88b59cab00',
    'b24704cd-2d7a-4279-aee7-1a9e1361a068',
    'um greiðsluþátttöku Tryggingastofnunar ríkisins vegna þjónustu sjálfstætt starfandi sérfræðinga í hjartalækningum.',
    '2023-09-15T21:01:49.156Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'b3b046a6-cf44-4cb7-959f-c84e16a59431',
    'BA768F6E-302B-4B15-B43C-20C66335C018'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'b3b046a6-cf44-4cb7-959f-c84e16a59431',
    '0048018F-8644-4262-8FA9-5688BC0CB6FB'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'b3b046a6-cf44-4cb7-959f-c84e16a59431',
    'C93FB012-0090-4F65-AD81-3709E30C0E65'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'b3b046a6-cf44-4cb7-959f-c84e16a59431',
    'FC09B2B6-CD12-4765-B4E5-92F77464DDDA'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'b3b046a6-cf44-4cb7-959f-c84e16a59431',
    '6CEB8C6F-B908-4B10-9C7F-A14508D0F90A'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'f0aff0ce-f90a-4af0-9900-3086ed43d1b7',
    'Ólafur Njáll Lárusson',
    NULL,
    NULL,
    'Fjármála- og efnahagsráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '2969d0e5-8204-4988-a656-24cdf51b749e',
    'Björn Ólafsson',
    NULL,
    NULL,
    'Menningar- og viðskiptaráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'f7952313-e302-4a04-9463-53d3037ae0d0',
    'Elín Ýr Njálsdóttir',
    NULL,
    NULL,
    'Þingmaður'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '25683fc8-c34c-4951-8433-52ae6b174f93',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2023-08-28T01:07:54.692Z',
    'Áfengis- og tóbaksverslun ríkisins',
    'AE0CDA19-8832-4F11-A2B7-6F5966A54C4D',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '25683fc8-c34c-4951-8433-52ae6b174f93',
    'f0aff0ce-f90a-4af0-9900-3086ed43d1b7'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '25683fc8-c34c-4951-8433-52ae6b174f93',
    '2969d0e5-8204-4988-a656-24cdf51b749e'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '25683fc8-c34c-4951-8433-52ae6b174f93',
    'f7952313-e302-4a04-9463-53d3037ae0d0'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'b3b046a6-cf44-4cb7-959f-c84e16a59431',
    '25683fc8-c34c-4951-8433-52ae6b174f93'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'e5f85469-7c44-41d7-b392-b5e0e1bab017',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202402008',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '480853f2-a511-41b5-b663-df655741e77a',
    '86F5815F-3436-446D-8007-D14C2DB3BEA5',
    '2024-02-08T16:33:49.124Z',
    '2024-02-08T16:33:49.124Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '69cd3e90-106e-4b9c-8419-148c29e1738a',
    '55ec9da9-f2c6-4c36-8f69-84e794b530cd',
    'fyrir sorphirðu í Borgarfjarðarhreppi.',
    '2024-02-16T11:44:45.843Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'e5f85469-7c44-41d7-b392-b5e0e1bab017',
    '360D68FF-91EA-413C-9A7B-9ED6EEE8F4D1'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'e5f85469-7c44-41d7-b392-b5e0e1bab017',
    'D1623FE0-EB23-4686-A98A-A36EEB6F59AD'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'e5f85469-7c44-41d7-b392-b5e0e1bab017',
    '87CCEE04-3530-4284-AA50-D34160ABD378'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'd952bebc-13a6-4f0a-aaf0-1c1a6af6042d',
    'Ragnar Stefánsson',
    NULL,
    NULL,
    'Dómsmálaráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '74f1943a-50ce-4ca3-a046-a40a6b3e6392',
    'Fanney Ingibjörg Ýmirsdóttir',
    NULL,
    NULL,
    'Forsætisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '585403c6-d17a-4ed5-b79f-e8a03e736831',
    'Lárus Ögmundarson',
    NULL,
    NULL,
    'Heilbrigðisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '9536dc31-eb00-487d-9d77-4e41a80036ce',
    'Lilja Úlfarsdóttir',
    NULL,
    NULL,
    'Forsætisráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '14dd9d38-3d65-41bc-b9ba-243e66c0996d',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2024-02-08T16:33:49.124Z',
    'Ríkissáttasemjari',
    '86F5815F-3436-446D-8007-D14C2DB3BEA5',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '14dd9d38-3d65-41bc-b9ba-243e66c0996d',
    'd952bebc-13a6-4f0a-aaf0-1c1a6af6042d'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '14dd9d38-3d65-41bc-b9ba-243e66c0996d',
    '74f1943a-50ce-4ca3-a046-a40a6b3e6392'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '14dd9d38-3d65-41bc-b9ba-243e66c0996d',
    '585403c6-d17a-4ed5-b79f-e8a03e736831'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '14dd9d38-3d65-41bc-b9ba-243e66c0996d',
    '9536dc31-eb00-487d-9d77-4e41a80036ce'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'e5f85469-7c44-41d7-b392-b5e0e1bab017',
    '14dd9d38-3d65-41bc-b9ba-243e66c0996d'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '7e1c8dff-2702-456f-b685-c69a61ca3f82',
    'Ösp Elín Oddardóttir',
    NULL,
    NULL,
    'Innviðaráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '3ea19de3-94e9-4e7b-817a-1f6f21fed2f0',
    'Nína Pétursdóttir',
    NULL,
    NULL,
    'Fjármála- og efnahagsráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '6efb912c-f83b-4077-ab71-c7133e93a684',
    'Jón Þorsteinsson',
    NULL,
    NULL,
    'Forsætisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '80bf9cf0-8995-4ccd-857a-55633857a93e',
    'Ýmir Hjalti Davíðsson',
    NULL,
    NULL,
    'Varaseðlabankastjóri'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'f91404df-ca85-4232-9577-ba46488f2791',
    'Elín Helga Gunnarsdóttir',
    NULL,
    NULL,
    'Þingmaður'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '03e1eea3-d6ce-435a-b22a-1cffd27f2017',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2024-02-08T16:33:49.124Z',
    'Ríkislögmaður',
    '86F5815F-3436-446D-8007-D14C2DB3BEA5',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '03e1eea3-d6ce-435a-b22a-1cffd27f2017',
    '7e1c8dff-2702-456f-b685-c69a61ca3f82'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '03e1eea3-d6ce-435a-b22a-1cffd27f2017',
    '3ea19de3-94e9-4e7b-817a-1f6f21fed2f0'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '03e1eea3-d6ce-435a-b22a-1cffd27f2017',
    '6efb912c-f83b-4077-ab71-c7133e93a684'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '03e1eea3-d6ce-435a-b22a-1cffd27f2017',
    '80bf9cf0-8995-4ccd-857a-55633857a93e'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '03e1eea3-d6ce-435a-b22a-1cffd27f2017',
    'f91404df-ca85-4232-9577-ba46488f2791'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'e5f85469-7c44-41d7-b392-b5e0e1bab017',
    '03e1eea3-d6ce-435a-b22a-1cffd27f2017'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '6a871772-9181-4546-b31f-6742cec7e7b2',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202302018',
    '799722be-5530-439a-91dc-606e129b030d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '195ECCDC-BAF3-4CEC-97AC-EF1C5161B091',
    '2023-02-18T04:38:21.702Z',
    '2023-02-18T04:38:21.702Z',
    true,
    NULL,
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    true,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um vátryggingafjárhæðir í aksturskeppni.',
    '2023-03-04T17:41:46.062Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '6a871772-9181-4546-b31f-6742cec7e7b2',
    'ED5BA9A8-B683-4BE0-95A5-64B5EAAA77C3'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '6a871772-9181-4546-b31f-6742cec7e7b2',
    'E3816C33-2724-44E8-9408-3C5BF0D49338'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '6a871772-9181-4546-b31f-6742cec7e7b2',
    'CC9E148C-2577-41E6-8478-A493F4184A5C'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '3ad6757e-e14b-4dcd-abcd-b428e81ea82b',
    'Njáll Magnússon',
    NULL,
    'Umhverfis-, orku og loftslagsráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '39f2a4fc-16c7-47a0-8cd1-f19e8f241614',
    'Andri Hjaltason',
    NULL,
    NULL,
    'Heilbrigðisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '4de88738-d527-47ea-a207-43ca4454b4ef',
    'Elín Elín Valdimarsdóttir',
    NULL,
    'Mennta- og barnamálaráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'f6b125d9-7326-47db-8f8f-4759532e4bf2',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2023-02-18T04:38:21.702Z',
    'Tryggingastofnun ríkisins',
    '195ECCDC-BAF3-4CEC-97AC-EF1C5161B091',
    '3ad6757e-e14b-4dcd-abcd-b428e81ea82b',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f6b125d9-7326-47db-8f8f-4759532e4bf2',
    '3ad6757e-e14b-4dcd-abcd-b428e81ea82b'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f6b125d9-7326-47db-8f8f-4759532e4bf2',
    '39f2a4fc-16c7-47a0-8cd1-f19e8f241614'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f6b125d9-7326-47db-8f8f-4759532e4bf2',
    '4de88738-d527-47ea-a207-43ca4454b4ef'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '6a871772-9181-4546-b31f-6742cec7e7b2',
    'f6b125d9-7326-47db-8f8f-4759532e4bf2'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'c884d596-e103-487e-bcd1-8a0af9a739c2',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202309021',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '10352915-B6D9-4F61-9657-FEB616B32EDC',
    '2023-09-21T02:02:01.784Z',
    '2023-09-21T02:02:01.784Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um breytingu á gjaldskrá Umferðarstofu nr. 681/2002.',
    '2023-10-20T14:44:25.882Z',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '1633e0b6-7966-4200-92e0-14b00fe1f733',
    'Ylfa Ylfa Björnsdóttir',
    NULL,
    NULL,
    'Innviðaráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '5f4076c8-f4d4-449e-be79-c5de4d4182fb',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2023-09-21T02:02:01.784Z',
    'Sýslumaðurinn í Vestmannaeyjum',
    '10352915-B6D9-4F61-9657-FEB616B32EDC',
    '1633e0b6-7966-4200-92e0-14b00fe1f733',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '5f4076c8-f4d4-449e-be79-c5de4d4182fb',
    '1633e0b6-7966-4200-92e0-14b00fe1f733'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'c884d596-e103-487e-bcd1-8a0af9a739c2',
    '5f4076c8-f4d4-449e-be79-c5de4d4182fb'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '31f188e9-4604-4f9b-bc7e-e1977a42107d',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202404019',
    '799722be-5530-439a-91dc-606e129b030d',
    '480853f2-a511-41b5-b663-df655741e77a',
    '191C2D3F-1444-49B3-A8D7-B067DAB2DC45',
    '2024-04-19T02:59:53.353Z',
    '2024-04-19T02:59:53.353Z',
    false,
    NULL,
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    false,
    false,
    '69cd3e90-106e-4b9c-8419-148c29e1738a',
    '2fb5ed9c-3044-4ee6-823f-44f99bdbc0cc',
    'um breytingu á reglugerð nr. 822/2004 um gerð og búnað ökutækja.',
    '2024-05-17T04:33:06.007Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '31f188e9-4604-4f9b-bc7e-e1977a42107d',
    'D75C049B-7EED-42DF-9C54-C92A28E1ABF6'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '31f188e9-4604-4f9b-bc7e-e1977a42107d',
    '587138EB-98B3-44C2-B8C6-86EC9A252CB2'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '31f188e9-4604-4f9b-bc7e-e1977a42107d',
    '2E39D89E-5E93-4E22-B855-8ACAE73F16CB'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '31f188e9-4604-4f9b-bc7e-e1977a42107d',
    '0048018F-8644-4262-8FA9-5688BC0CB6FB'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '31f188e9-4604-4f9b-bc7e-e1977a42107d',
    '90953072-4955-4584-BC77-2EE9F4609FA4'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'b5fed6bc-4d61-4472-900c-05b69ca4e530',
    'Kristín Ragnarsdóttir',
    NULL,
    NULL,
    'Varaseðlabankastjóri'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '0bc15e30-2ece-4721-9c3c-38ea33fa1c34',
    'Einar Ýmir Yngvason',
    NULL,
    NULL,
    'Þingmaður'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'ac6170e5-6f97-4fee-99b2-034590d9b462',
    'Fanney Ásta Ólafsdóttir',
    NULL,
    'Umhverfis-, orku og loftslagsráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'd5c4dc2a-9cb4-42ce-b96c-fa74f6104783',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2024-04-19T02:59:53.353Z',
    'Lyfjastofnun',
    '191C2D3F-1444-49B3-A8D7-B067DAB2DC45',
    'b5fed6bc-4d61-4472-900c-05b69ca4e530',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'd5c4dc2a-9cb4-42ce-b96c-fa74f6104783',
    'b5fed6bc-4d61-4472-900c-05b69ca4e530'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'd5c4dc2a-9cb4-42ce-b96c-fa74f6104783',
    '0bc15e30-2ece-4721-9c3c-38ea33fa1c34'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'd5c4dc2a-9cb4-42ce-b96c-fa74f6104783',
    'ac6170e5-6f97-4fee-99b2-034590d9b462'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '31f188e9-4604-4f9b-bc7e-e1977a42107d',
    'd5c4dc2a-9cb4-42ce-b96c-fa74f6104783'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'e2ced54d-96f7-4b50-b03d-e7443a3b4b74',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202402023',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    '99C27163-5E88-4DE4-858C-8899036F3C4A',
    '2024-02-23T09:46:08.339Z',
    '2024-02-23T09:46:08.339Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    true,
    false,
    '637291f2-f7f4-405d-8586-ef88b59cab00',
    'e037a62a-b10b-4c6b-befb-139ed807a2c0',
    'um staðfestingu félagsmálaráðuneytis á sameiningu Húsavíkurbæjar, Kelduneshrepps, Öxarfjarðarhrepps og Raufarhafnarhrepps í eitt sveitarfélag.',
    '2024-03-13T18:53:16.596Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'e2ced54d-96f7-4b50-b03d-e7443a3b4b74',
    '1E11A17F-8EC4-4162-BBAF-7A88724240A5'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'e2ced54d-96f7-4b50-b03d-e7443a3b4b74',
    '03E8EB0E-998C-403D-A89E-B1E4FE86E22C'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'b86433a3-a007-4446-aab4-7fa725cb4248',
    'Þórdís Tanja Pétursdóttir',
    NULL,
    NULL,
    'Háskóla-, iðnaða- og nýsköpunarráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '7e84b282-d7e7-4315-a224-e243a346fd33',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2024-02-23T09:46:08.339Z',
    'Verðlagsstofa skiptaverðs',
    '99C27163-5E88-4DE4-858C-8899036F3C4A',
    'b86433a3-a007-4446-aab4-7fa725cb4248',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '7e84b282-d7e7-4315-a224-e243a346fd33',
    'b86433a3-a007-4446-aab4-7fa725cb4248'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'e2ced54d-96f7-4b50-b03d-e7443a3b4b74',
    '7e84b282-d7e7-4315-a224-e243a346fd33'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'd5dbe9b8-9e29-4c20-97c5-6306df86bf37',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202306008',
    '799722be-5530-439a-91dc-606e129b030d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'ECD0328D-6B7E-49AA-B7C2-B6614B255649',
    '2023-06-08T18:52:48.016Z',
    '2023-06-08T18:52:48.016Z',
    false,
    NULL,
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'fyrir búfjáreftirlit í Grundarfjarðarbæ.',
    '2023-06-10T08:54:17.950Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'd5dbe9b8-9e29-4c20-97c5-6306df86bf37',
    '6ADC7C68-5ADA-49EE-BC3C-6C25A02CA748'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'd5dbe9b8-9e29-4c20-97c5-6306df86bf37',
    '347EAC49-0DCC-437C-ACA5-15B035111114'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'd5dbe9b8-9e29-4c20-97c5-6306df86bf37',
    '73ACB772-0E63-4785-A622-CF0A5120D1A1'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'd5dbe9b8-9e29-4c20-97c5-6306df86bf37',
    'D16CE5A6-6B59-4A2A-90F5-0D41B7427CEF'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '7d8658f4-563d-4113-bb82-55f20c08aaa3',
    'Yngvi Njálsson',
    NULL,
    'Forsætisráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '24f84af4-cd27-439b-9c48-1a190c224dca',
    'Gunnar Karl Stefánsson',
    NULL,
    NULL,
    'Háskóla-, iðnaða- og nýsköpunarráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '07a70b64-db79-4081-81da-58c3d0c5d375',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2023-06-08T18:52:48.016Z',
    'Minjastofnun Íslands',
    'ECD0328D-6B7E-49AA-B7C2-B6614B255649',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '07a70b64-db79-4081-81da-58c3d0c5d375',
    '7d8658f4-563d-4113-bb82-55f20c08aaa3'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '07a70b64-db79-4081-81da-58c3d0c5d375',
    '24f84af4-cd27-439b-9c48-1a190c224dca'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'd5dbe9b8-9e29-4c20-97c5-6306df86bf37',
    '07a70b64-db79-4081-81da-58c3d0c5d375'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '9ebe227d-a757-456e-bcc9-14cd77c3be59',
    'Pétur Einarsson',
    NULL,
    NULL,
    'Matvælaráðherra '
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '2196602a-970c-4ef8-9a87-f37413f4f713',
    'Ólafur Hjalti Njálsson',
    NULL,
    NULL,
    'Háskóla-, iðnaða- og nýsköpunarráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '8c5a2f09-bee3-490e-b790-854e4ebb9532',
    'Ösp Lárusdóttir',
    NULL,
    NULL,
    'Mennta- og barnamálaráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '546297c0-2689-460d-88f6-d578231bcd73',
    'Unnar Unnar Hjaltason',
    NULL,
    'Sendiherra',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'ebc7df58-05c5-4e8f-9229-d88f88da9e4b',
    'Stefán Björnsson',
    NULL,
    'Dómari',
    NULL
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'dcdb1ff5-c54c-4ed3-a31b-fe4f343794e8',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2023-06-08T18:52:48.016Z',
    'Stofnun Vilhjálms Stefánssonar',
    'ECD0328D-6B7E-49AA-B7C2-B6614B255649',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'dcdb1ff5-c54c-4ed3-a31b-fe4f343794e8',
    '9ebe227d-a757-456e-bcc9-14cd77c3be59'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'dcdb1ff5-c54c-4ed3-a31b-fe4f343794e8',
    '2196602a-970c-4ef8-9a87-f37413f4f713'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'dcdb1ff5-c54c-4ed3-a31b-fe4f343794e8',
    '8c5a2f09-bee3-490e-b790-854e4ebb9532'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'dcdb1ff5-c54c-4ed3-a31b-fe4f343794e8',
    '546297c0-2689-460d-88f6-d578231bcd73'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'dcdb1ff5-c54c-4ed3-a31b-fe4f343794e8',
    'ebc7df58-05c5-4e8f-9229-d88f88da9e4b'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'd5dbe9b8-9e29-4c20-97c5-6306df86bf37',
    'dcdb1ff5-c54c-4ed3-a31b-fe4f343794e8'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '56f86178-079e-4692-bdde-8f04bc7972de',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202404029',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    '926F3689-5C24-45E7-B098-E2BBEA93133D',
    '2024-04-29T07:26:21.378Z',
    '2024-04-29T07:26:21.378Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um breytingar á lagaákvæðum um fjármálaeftirlit.',
    '2024-05-23T02:12:29.449Z',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'd2ece09b-4e43-4072-bb4f-bec6f5ce5ad8',
    'Yngvi Unnar Njálsson',
    NULL,
    'Bankaráðsmaður',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '91a40c4e-6cc8-4164-b1fc-63f0cb881b6d',
    'Úlfar Úlfarsson',
    NULL,
    NULL,
    'Varaseðlabankastjóri'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '7fcb1053-d01a-4e88-bd90-eeb9689ad215',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2024-04-29T07:26:21.378Z',
    'Rannsóknarnefnd samgönguslysa',
    '926F3689-5C24-45E7-B098-E2BBEA93133D',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '7fcb1053-d01a-4e88-bd90-eeb9689ad215',
    'd2ece09b-4e43-4072-bb4f-bec6f5ce5ad8'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '7fcb1053-d01a-4e88-bd90-eeb9689ad215',
    '91a40c4e-6cc8-4164-b1fc-63f0cb881b6d'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '56f86178-079e-4692-bdde-8f04bc7972de',
    '7fcb1053-d01a-4e88-bd90-eeb9689ad215'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'c501482b-4284-482d-9894-409af5ac8186',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202306004',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    'D687B9C0-A3E1-4F6B-8461-413A785A8D82',
    '2023-06-04T05:08:46.393Z',
    '2023-06-04T05:08:46.393Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um deiliskipulag flugvallarsvæðis, Akureyri.',
    '2023-06-22T11:59:02.822Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'c501482b-4284-482d-9894-409af5ac8186',
    'C0B16FE9-7119-43C8-9CBD-0CBDB379E9F5'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'c501482b-4284-482d-9894-409af5ac8186',
    'F1E42C49-571D-483E-9945-4BFB9A76B9AF'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'c501482b-4284-482d-9894-409af5ac8186',
    'E57CC67C-C180-4523-9596-11FE8D8FCFB8'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '89b046ee-08c6-4d2b-828d-76017c3bc5c5',
    'Margrét Ögmundardóttir',
    NULL,
    NULL,
    'Utanríkisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'd8ed132a-4b3a-4e6a-a303-870d165abfc5',
    'Valdimar Oddarson',
    NULL,
    'Stjórnarmenn',
    NULL
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '55359a28-1c71-4a62-8a7e-846b5a5691d2',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2023-06-04T05:08:46.393Z',
    'Seðlabanki Íslands (C-hluta stofnun)',
    'D687B9C0-A3E1-4F6B-8461-413A785A8D82',
    '89b046ee-08c6-4d2b-828d-76017c3bc5c5',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '55359a28-1c71-4a62-8a7e-846b5a5691d2',
    '89b046ee-08c6-4d2b-828d-76017c3bc5c5'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '55359a28-1c71-4a62-8a7e-846b5a5691d2',
    'd8ed132a-4b3a-4e6a-a303-870d165abfc5'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'c501482b-4284-482d-9894-409af5ac8186',
    '55359a28-1c71-4a62-8a7e-846b5a5691d2'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '8d8dc63e-9615-4094-85da-653f4d3f1299',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202204006',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '480853f2-a511-41b5-b663-df655741e77a',
    'AED885A6-D3DE-4BE8-A2D7-4EE87332DDFF',
    '2022-04-06T12:20:42.945Z',
    '2022-04-06T12:20:42.945Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um breytingu á aðalskipulagi Borgarbyggðar 1997-2017, stofnanasvæði við Svöluklett.',
    '2022-04-08T05:55:47.820Z',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '671963d2-3625-49c2-b44a-2c0190d86c99',
    'Davíð Björn Hjaltason',
    NULL,
    'Framkvæmdarstjóri',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'b733c965-8f1f-4b12-9aed-ba8da96d7c11',
    'Tanja Ólafsdóttir',
    NULL,
    'Sendiherra',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '977b03f0-6dd7-4df9-aefc-2281238b865b',
    'Kristín Bryndís Njálsdóttir',
    NULL,
    NULL,
    'Dómari'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '8522310e-4cb0-4131-87b0-b19471df76b0',
    'Lilja Íris Úlfarsdóttir',
    NULL,
    NULL,
    'Félags- og vinnumálaráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'cccc217b-b65d-45df-bf39-2f987a71966a',
    'Gunnar Unnarsson',
    NULL,
    NULL,
    'Bankaráðsmaður'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '4c0da5c2-c1d3-4dc6-a46e-c66b6157940d',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2022-04-06T12:20:42.945Z',
    'Neytendastofa',
    'AED885A6-D3DE-4BE8-A2D7-4EE87332DDFF',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '4c0da5c2-c1d3-4dc6-a46e-c66b6157940d',
    '671963d2-3625-49c2-b44a-2c0190d86c99'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '4c0da5c2-c1d3-4dc6-a46e-c66b6157940d',
    'b733c965-8f1f-4b12-9aed-ba8da96d7c11'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '4c0da5c2-c1d3-4dc6-a46e-c66b6157940d',
    '977b03f0-6dd7-4df9-aefc-2281238b865b'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '4c0da5c2-c1d3-4dc6-a46e-c66b6157940d',
    '8522310e-4cb0-4131-87b0-b19471df76b0'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '4c0da5c2-c1d3-4dc6-a46e-c66b6157940d',
    'cccc217b-b65d-45df-bf39-2f987a71966a'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '8d8dc63e-9615-4094-85da-653f4d3f1299',
    '4c0da5c2-c1d3-4dc6-a46e-c66b6157940d'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '24564d5d-2319-42c0-aa2d-cb3152d2472e',
    'Gunnar Björn Pétursson',
    NULL,
    NULL,
    'Dómsmálaráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '7e492fa5-af5d-4c7f-9eb8-a1f4627b1d5b',
    'Jóhanna Njálsdóttir',
    NULL,
    'Utanríkisráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '38a6f670-7eab-421b-b3b4-579eb38c1e1c',
    'Ragnheiður Unnur Karlsdóttir',
    NULL,
    NULL,
    'Utanríkisráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'fe666d06-63b6-456e-ac98-5f26254f325d',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2022-04-06T12:20:42.945Z',
    'Sýslumaðurinn á Höfuðborgarsvæðinu',
    'AED885A6-D3DE-4BE8-A2D7-4EE87332DDFF',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'fe666d06-63b6-456e-ac98-5f26254f325d',
    '24564d5d-2319-42c0-aa2d-cb3152d2472e'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'fe666d06-63b6-456e-ac98-5f26254f325d',
    '7e492fa5-af5d-4c7f-9eb8-a1f4627b1d5b'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'fe666d06-63b6-456e-ac98-5f26254f325d',
    '38a6f670-7eab-421b-b3b4-579eb38c1e1c'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '8d8dc63e-9615-4094-85da-653f4d3f1299',
    'fe666d06-63b6-456e-ac98-5f26254f325d'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '9f58b2b4-89c9-4ad4-8468-17d4cc172292',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202407008',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    'E47C3C3F-A714-4105-B6D6-AEC58FF8EFD5',
    '2024-07-08T00:27:59.164Z',
    '2024-07-08T00:27:59.164Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '637291f2-f7f4-405d-8586-ef88b59cab00',
    'c17d412a-cf07-49eb-a743-363bfcbfa497',
    'um (2.) breytingu á reglugerð nr. 881/2003 um niðurfellingu eða endurgreiðslu tolla fyrir matvælaiðnað.',
    '2024-07-09T18:51:19.788Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '9f58b2b4-89c9-4ad4-8468-17d4cc172292',
    '96C8241D-46D5-4E82-8942-00F21C896AF1'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '9f58b2b4-89c9-4ad4-8468-17d4cc172292',
    '2452649B-DEF6-4E31-B1A8-D0453620BF9B'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '90e13fd2-1e6a-4de8-ba97-820d49586d5e',
    'Valgerður Ragnarsdóttir',
    NULL,
    NULL,
    'Utanríkisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '9fe1ce6a-b940-41e7-9b87-0e6b81609fbb',
    'Valdimar Ingimar Stefánsson',
    NULL,
    NULL,
    'Þingmaður'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'f81329fc-632e-4c4d-a99c-fa29a4f0c383',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2024-07-08T00:27:59.164Z',
    'Hljóðbókasafn Íslands',
    'E47C3C3F-A714-4105-B6D6-AEC58FF8EFD5',
    '90e13fd2-1e6a-4de8-ba97-820d49586d5e',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f81329fc-632e-4c4d-a99c-fa29a4f0c383',
    '90e13fd2-1e6a-4de8-ba97-820d49586d5e'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f81329fc-632e-4c4d-a99c-fa29a4f0c383',
    '9fe1ce6a-b940-41e7-9b87-0e6b81609fbb'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '9f58b2b4-89c9-4ad4-8468-17d4cc172292',
    'f81329fc-632e-4c4d-a99c-fa29a4f0c383'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '03bcc701-f459-4051-9885-d67f4bd584fd',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202304016',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '0C412FB7-B003-4405-A059-EE4FC0E3B572',
    '2023-04-16T08:12:21.483Z',
    '2023-04-16T08:12:21.483Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um deiliskipulag á Akranesi.',
    '2023-04-25T12:39:27.086Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '03bcc701-f459-4051-9885-d67f4bd584fd',
    '27E60EF6-9002-4EC8-8EA2-020382B701D2'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '993dcdb3-d43a-4f6a-885a-327ec3fa1058',
    'Tómas Yngvi Ragnarsson',
    NULL,
    NULL,
    'Þingmaður'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'b43c9593-5e63-4e8a-a5e4-4ca2a33f7c33',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2023-04-16T08:12:21.483Z',
    'Fjarskiptastofa',
    '0C412FB7-B003-4405-A059-EE4FC0E3B572',
    '993dcdb3-d43a-4f6a-885a-327ec3fa1058',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'b43c9593-5e63-4e8a-a5e4-4ca2a33f7c33',
    '993dcdb3-d43a-4f6a-885a-327ec3fa1058'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '03bcc701-f459-4051-9885-d67f4bd584fd',
    'b43c9593-5e63-4e8a-a5e4-4ca2a33f7c33'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '46b162a4-06c4-442a-b9e6-931ecd322383',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202312016',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    '2185E1B1-7380-49FB-B989-59FB1A2BE67E',
    '2023-12-16T14:32:59.322Z',
    '2023-12-16T14:32:59.322Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '69cd3e90-106e-4b9c-8419-148c29e1738a',
    '69ea646d-c0e5-4335-9b17-33e8e1c1060a',
    'um gildistöku reglugerða Evrópusambandsins um almannatryggingar (VIII).',
    '2023-12-26T16:05:45.080Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '46b162a4-06c4-442a-b9e6-931ecd322383',
    'A2B93601-AC71-47EC-9648-F135592D4172'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '46b162a4-06c4-442a-b9e6-931ecd322383',
    'A145B8D6-047C-4A22-BBAD-C87E07034FBA'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '46b162a4-06c4-442a-b9e6-931ecd322383',
    '31C8CD81-E348-4382-A3EA-A3633B7D986E'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '15b632cc-f51d-4245-ac4f-c7c37e7653a1',
    'Oddur Stefán Njálsson',
    NULL,
    NULL,
    'Innviðaráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '936401f3-d19e-4055-b305-d59bc1befe76',
    'Björn Ingimarsson',
    NULL,
    NULL,
    'Háskóla-, iðnaða- og nýsköpunarráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'ad3c1fde-5a5b-4ac3-8a06-462997b1d3b8',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2023-12-16T14:32:59.322Z',
    'Barna- og fjölskyldustofa',
    '2185E1B1-7380-49FB-B989-59FB1A2BE67E',
    '15b632cc-f51d-4245-ac4f-c7c37e7653a1',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'ad3c1fde-5a5b-4ac3-8a06-462997b1d3b8',
    '15b632cc-f51d-4245-ac4f-c7c37e7653a1'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'ad3c1fde-5a5b-4ac3-8a06-462997b1d3b8',
    '936401f3-d19e-4055-b305-d59bc1befe76'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '46b162a4-06c4-442a-b9e6-931ecd322383',
    'ad3c1fde-5a5b-4ac3-8a06-462997b1d3b8'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'b991649b-c047-4aa2-8597-e8fc4d1a54ed',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202307004',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '9EFA5B1B-C125-4A9A-A3C2-DF726548A37D',
    '2023-07-04T21:07:08.324Z',
    '2023-07-04T21:07:08.324Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'fyrir Sjálfseignarstofnunina Grímstungu- og Haukagilsheiði.',
    '2023-07-14T05:00:47.396Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'b991649b-c047-4aa2-8597-e8fc4d1a54ed',
    'F637CF08-73B7-4684-B95E-A2E170A52594'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'b991649b-c047-4aa2-8597-e8fc4d1a54ed',
    'F9D5DDE5-82C1-4513-80B3-C612785C935F'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'b991649b-c047-4aa2-8597-e8fc4d1a54ed',
    'FE3610B6-189E-4D99-89DA-16FEA7919757'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'b991649b-c047-4aa2-8597-e8fc4d1a54ed',
    'A9FCCBA3-0A99-42FE-9C5B-EC963C80E046'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'b991649b-c047-4aa2-8597-e8fc4d1a54ed',
    'E824D8BC-5B12-445B-B15E-7AD583869172'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '620cc9c4-23e9-4106-ba01-2eba263170bb',
    'Þorsteinn Ýmirsson',
    NULL,
    NULL,
    'Framkvæmdarstjóri'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '222b4cfa-d1c8-4c48-851b-bf6f2473f14b',
    'Pétur Tómasson',
    NULL,
    NULL,
    'Forsætisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '62664718-e4c1-483a-9cc0-193777866143',
    'Karl Ýmir Tómasson',
    NULL,
    NULL,
    'Menningar- og viðskiptaráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'b35e6cc9-abe1-46fe-a276-f25c440e41c4',
    'Ingibjörg Einarsdóttir',
    NULL,
    NULL,
    'Varaseðlabankastjóri'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '677f4777-665b-4569-a108-61a405294766',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2023-07-04T21:07:08.324Z',
    'Héraðsdómur Vesturlands',
    '9EFA5B1B-C125-4A9A-A3C2-DF726548A37D',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '677f4777-665b-4569-a108-61a405294766',
    '620cc9c4-23e9-4106-ba01-2eba263170bb'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '677f4777-665b-4569-a108-61a405294766',
    '222b4cfa-d1c8-4c48-851b-bf6f2473f14b'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '677f4777-665b-4569-a108-61a405294766',
    '62664718-e4c1-483a-9cc0-193777866143'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '677f4777-665b-4569-a108-61a405294766',
    'b35e6cc9-abe1-46fe-a276-f25c440e41c4'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'b991649b-c047-4aa2-8597-e8fc4d1a54ed',
    '677f4777-665b-4569-a108-61a405294766'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '0926c150-c231-4dbd-8495-06990c461101',
    'Ingibjörg Úlfarsdóttir',
    NULL,
    NULL,
    'Dómari'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'e9039641-6d5d-46ed-b058-f38398c7d465',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2023-07-04T21:07:08.324Z',
    'Heilbrigðisstofnun Norðurlands',
    '9EFA5B1B-C125-4A9A-A3C2-DF726548A37D',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'e9039641-6d5d-46ed-b058-f38398c7d465',
    '0926c150-c231-4dbd-8495-06990c461101'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'b991649b-c047-4aa2-8597-e8fc4d1a54ed',
    'e9039641-6d5d-46ed-b058-f38398c7d465'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '4754841f-a02b-49b2-89d7-d22f13f52b9e',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202301028',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    '7D46BBB1-98DC-428E-A7CB-CBE8E3752D4A',
    '2023-01-28T21:54:52.492Z',
    '2023-01-28T21:54:52.492Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um skattmat vegna tekna af landbúnaði árið 2006.',
    '2023-02-27T13:19:55.074Z',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '2b6468c2-82f0-4dda-b4ff-0a7434cdfda5',
    'Yngvi Ragnarsson',
    NULL,
    'Þingmaður',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '860e81b5-d9ff-46d1-8365-84130389bc5a',
    'Úlfhildur Íris Yngvadóttir',
    NULL,
    'Mennta- og barnamálaráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'd84e5929-c49f-4ee3-a4d2-bea2e0454ad5',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2023-01-28T21:54:52.492Z',
    'Lögreglustjórinn á Vestfjörðum',
    '7D46BBB1-98DC-428E-A7CB-CBE8E3752D4A',
    '2b6468c2-82f0-4dda-b4ff-0a7434cdfda5',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'd84e5929-c49f-4ee3-a4d2-bea2e0454ad5',
    '2b6468c2-82f0-4dda-b4ff-0a7434cdfda5'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'd84e5929-c49f-4ee3-a4d2-bea2e0454ad5',
    '860e81b5-d9ff-46d1-8365-84130389bc5a'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '4754841f-a02b-49b2-89d7-d22f13f52b9e',
    'd84e5929-c49f-4ee3-a4d2-bea2e0454ad5'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '519bebc5-b5c3-48b7-8a2a-939a24da3e2c',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202310012',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '8555af9f-96be-4320-8c51-e96e8d7010a9',
    '9C62C66B-2148-40FD-966C-EBB5D72E4AA1',
    '2023-10-12T12:03:00.201Z',
    '2023-10-12T12:03:00.201Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um breytingu á reglugerð nr. 586/2002 um efni sem eyða ósonlaginu.',
    '2023-11-09T10:44:16.674Z',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '992e8b76-6971-4e4c-a237-4cef2877fcb4',
    'Björn Ýmir Ýmirsson',
    NULL,
    'Varaseðlabankastjóri',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '55f28cad-7e88-458c-9f7e-ff2a80e4b317',
    'Ýmir Andri Yngvason',
    NULL,
    NULL,
    'Varaseðlabankastjóri'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'f876ca2a-4a9c-41d1-8899-3e4e53e6c626',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2023-10-12T12:03:00.201Z',
    'Háskólinn á Akureyri',
    '9C62C66B-2148-40FD-966C-EBB5D72E4AA1',
    '992e8b76-6971-4e4c-a237-4cef2877fcb4',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f876ca2a-4a9c-41d1-8899-3e4e53e6c626',
    '992e8b76-6971-4e4c-a237-4cef2877fcb4'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f876ca2a-4a9c-41d1-8899-3e4e53e6c626',
    '55f28cad-7e88-458c-9f7e-ff2a80e4b317'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '519bebc5-b5c3-48b7-8a2a-939a24da3e2c',
    'f876ca2a-4a9c-41d1-8899-3e4e53e6c626'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'b0a0bf7b-5097-420c-9ef6-a84753b7a897',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202407020',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    'EBB18818-8673-4F97-8CEC-1041FB8CE667',
    '2024-07-20T05:18:13.266Z',
    '2024-07-20T05:18:13.266Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um að forseti Íslands sé kominn heim og tekinn við stjórnarstörfum.',
    '2024-07-30T05:25:25.964Z',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '160c0881-bcc9-4ac7-9038-e5e2e67de9c6',
    'Oddný Ásta Lárusdóttir',
    NULL,
    'Matvælaráðherra ',
    NULL
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'd7cb057f-9cb6-48b2-90f1-145d70478990',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2024-07-20T05:18:13.266Z',
    'Sjúkrahúsið Akureyri',
    'EBB18818-8673-4F97-8CEC-1041FB8CE667',
    '160c0881-bcc9-4ac7-9038-e5e2e67de9c6',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'd7cb057f-9cb6-48b2-90f1-145d70478990',
    '160c0881-bcc9-4ac7-9038-e5e2e67de9c6'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'b0a0bf7b-5097-420c-9ef6-a84753b7a897',
    'd7cb057f-9cb6-48b2-90f1-145d70478990'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'eb322271-9cca-4a4c-ba1d-1bd14965ccd8',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202407006',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '480853f2-a511-41b5-b663-df655741e77a',
    '99C27163-5E88-4DE4-858C-8899036F3C4A',
    '2024-07-06T04:34:04.165Z',
    '2024-07-06T04:34:04.165Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '637291f2-f7f4-405d-8586-ef88b59cab00',
    '9b7492a3-ae8a-4a8e-bc3b-492cb33c96e9',
    'um staðfestingu félagsmálaráðuneytis á sameiningu Broddaneshrepps og Hólmavíkurhrepps í eitt sveitarfélag.',
    '2024-07-10T10:26:19.168Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'eb322271-9cca-4a4c-ba1d-1bd14965ccd8',
    '1ABBC0C1-FACA-4BA7-972F-8BC307507946'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'eb322271-9cca-4a4c-ba1d-1bd14965ccd8',
    '326C65F3-DC45-47FA-BFCC-2107F3F573EE'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '4169252f-1155-4d92-bfb8-c444229e9188',
    'Magnús Stefán Finnsson',
    NULL,
    NULL,
    'Menningar- og viðskiptaráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '4743bd41-199c-4181-bd5b-7987b6e7780c',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2024-07-06T04:34:04.165Z',
    'Héraðsdómur Vesturlands',
    '99C27163-5E88-4DE4-858C-8899036F3C4A',
    '4169252f-1155-4d92-bfb8-c444229e9188',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '4743bd41-199c-4181-bd5b-7987b6e7780c',
    '4169252f-1155-4d92-bfb8-c444229e9188'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'eb322271-9cca-4a4c-ba1d-1bd14965ccd8',
    '4743bd41-199c-4181-bd5b-7987b6e7780c'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '4ab3a526-05db-4dc6-93bf-e1139ffb61fd',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202307024',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    '480853f2-a511-41b5-b663-df655741e77a',
    'B092EF99-13A2-453B-A144-0A0BAAFD1F73',
    '2023-07-24T18:11:30.936Z',
    '2023-07-24T18:11:30.936Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '69cd3e90-106e-4b9c-8419-148c29e1738a',
    '7a6a59ac-45ed-401f-b2a3-8480fd4b6438',
    'fyrir búfjárhald í Sveitarfélaginu Ölfusi.',
    '2023-08-17T14:20:11.709Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '4ab3a526-05db-4dc6-93bf-e1139ffb61fd',
    'B5A0AF04-F26A-465A-9F24-2560EE59C600'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '4ab3a526-05db-4dc6-93bf-e1139ffb61fd',
    '99CB4009-1A0E-4791-8730-1CD8BCB7CF8E'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '4ab3a526-05db-4dc6-93bf-e1139ffb61fd',
    'E6BB8E18-40F7-4B30-BE21-581EC5DA5C92'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '4ab3a526-05db-4dc6-93bf-e1139ffb61fd',
    '3D3B03CC-8E3F-4A71-BA37-8FAB138201B2'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '4ab3a526-05db-4dc6-93bf-e1139ffb61fd',
    '3F0EA22D-2B1D-493C-AC2A-02BFD15A3EBC'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '84a18c12-1514-4709-b556-1c2dce732d25',
    'Unnar Yngvi Einarsson',
    NULL,
    NULL,
    'Sendiherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '3973f572-8475-41c5-96b7-e85b00451c01',
    'Njáll Pétur Ólafsson',
    NULL,
    NULL,
    'Þingmaður'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'dc00aece-2d79-4618-bd0a-6f2fa11c404e',
    'Lárus Valdimarsson',
    NULL,
    NULL,
    'Háskóla-, iðnaða- og nýsköpunarráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'fbaa6662-eb3b-4623-88a4-8b5c78df6ec6',
    'Þorsteinn Stefán Hjaltason',
    NULL,
    'Bankaráðsmaður',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'f87571ea-5c37-4ffb-828b-80d622224fae',
    'Elín Jóhanna Tómasdóttir',
    NULL,
    NULL,
    'Utanríkisráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'f9d1894e-8da4-4bf3-b12e-ddbde2921ec0',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2023-07-24T18:11:30.936Z',
    'Héraðsdómur Vesturlands',
    'B092EF99-13A2-453B-A144-0A0BAAFD1F73',
    '84a18c12-1514-4709-b556-1c2dce732d25',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f9d1894e-8da4-4bf3-b12e-ddbde2921ec0',
    '84a18c12-1514-4709-b556-1c2dce732d25'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f9d1894e-8da4-4bf3-b12e-ddbde2921ec0',
    '3973f572-8475-41c5-96b7-e85b00451c01'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f9d1894e-8da4-4bf3-b12e-ddbde2921ec0',
    'dc00aece-2d79-4618-bd0a-6f2fa11c404e'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f9d1894e-8da4-4bf3-b12e-ddbde2921ec0',
    'fbaa6662-eb3b-4623-88a4-8b5c78df6ec6'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'f9d1894e-8da4-4bf3-b12e-ddbde2921ec0',
    'f87571ea-5c37-4ffb-828b-80d622224fae'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '4ab3a526-05db-4dc6-93bf-e1139ffb61fd',
    'f9d1894e-8da4-4bf3-b12e-ddbde2921ec0'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '0efa0341-97a2-460f-a519-f02998c02c8e',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202404012',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '480853f2-a511-41b5-b663-df655741e77a',
    '926F3689-5C24-45E7-B098-E2BBEA93133D',
    '2024-04-12T01:29:14.733Z',
    '2024-04-12T01:29:14.733Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    true,
    false,
    '637291f2-f7f4-405d-8586-ef88b59cab00',
    '7568be17-1c62-4363-9733-aaa8341d1d63',
    'um breytingu á deiliskipulagi Valla, 3. áfanga, Berjavellir nr. 3 og Einivellir nr. 7, Hafnarfirði.',
    '2024-04-19T11:57:23.330Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '0efa0341-97a2-460f-a519-f02998c02c8e',
    'F125465F-6197-4CCB-977B-1CF32E03D2A7'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '0efa0341-97a2-460f-a519-f02998c02c8e',
    'CC9E148C-2577-41E6-8478-A493F4184A5C'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '0efa0341-97a2-460f-a519-f02998c02c8e',
    '4A44FD7E-7C82-4608-8A18-2112A2DCC0E8'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '0efa0341-97a2-460f-a519-f02998c02c8e',
    '2E12029A-E20B-4EA8-841F-4277365A56D3'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '0efa0341-97a2-460f-a519-f02998c02c8e',
    '6ADC7C68-5ADA-49EE-BC3C-6C25A02CA748'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '2bbcffa8-dd47-4d0d-95be-1a00341e7454',
    'Einar Ólafsson',
    NULL,
    NULL,
    'Sendiherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '1e332f9b-4c43-4d53-b979-d201d277f8f8',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2024-04-12T01:29:14.733Z',
    'Skatturinn',
    '926F3689-5C24-45E7-B098-E2BBEA93133D',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '1e332f9b-4c43-4d53-b979-d201d277f8f8',
    '2bbcffa8-dd47-4d0d-95be-1a00341e7454'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '0efa0341-97a2-460f-a519-f02998c02c8e',
    '1e332f9b-4c43-4d53-b979-d201d277f8f8'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '42b3b40b-17bd-4594-a049-c557bea1321a',
    'Ólöf Fanney Finnsdóttir',
    NULL,
    NULL,
    'Dómari'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '2e79f82a-ded7-4e6a-9674-ce6ba3d86479',
    'Perla Nína Karlsdóttir',
    NULL,
    NULL,
    'Þingmaður'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '0146e108-dde7-4448-b44c-f78876dfdc33',
    'Tanja Lilja Ólafsdóttir',
    NULL,
    NULL,
    'Mennta- og barnamálaráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'e7de4655-200e-4595-83e3-7562831042f0',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2024-04-12T01:29:14.733Z',
    'Samkeppniseftirlitið',
    '926F3689-5C24-45E7-B098-E2BBEA93133D',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'e7de4655-200e-4595-83e3-7562831042f0',
    '42b3b40b-17bd-4594-a049-c557bea1321a'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'e7de4655-200e-4595-83e3-7562831042f0',
    '2e79f82a-ded7-4e6a-9674-ce6ba3d86479'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'e7de4655-200e-4595-83e3-7562831042f0',
    '0146e108-dde7-4448-b44c-f78876dfdc33'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '0efa0341-97a2-460f-a519-f02998c02c8e',
    'e7de4655-200e-4595-83e3-7562831042f0'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '8fdcc788-24d7-412a-8834-137a84d78b67',
    'Bryndís Magnúsdóttir',
    NULL,
    NULL,
    'Sendiherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '0290cdfe-c89e-4ed7-9b21-ce9b59b3b763',
    'Ingibjörg Unnur Einarsdóttir',
    NULL,
    'Menningar- og viðskiptaráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'c590d850-718b-4e7f-9dde-ef47010e2168',
    'Ingimar Yngvi Oddarson',
    NULL,
    NULL,
    'Þingmaður'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'bfb8e968-3069-415a-b544-6d1ccaf9a25f',
    'Finnur Njáll Valdimarsson',
    NULL,
    NULL,
    'Framkvæmdarstjóri'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'b47e358a-a6c5-43ba-81f2-d4626aa10dbf',
    'Guðrún Ýmirsdóttir',
    NULL,
    NULL,
    'Aðstoðarframkvæmdarstjóri'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'd608ed19-4b9b-4079-bc97-f9397107dda6',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2024-04-12T01:29:14.733Z',
    'Fjarskiptastofa',
    '926F3689-5C24-45E7-B098-E2BBEA93133D',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'd608ed19-4b9b-4079-bc97-f9397107dda6',
    '8fdcc788-24d7-412a-8834-137a84d78b67'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'd608ed19-4b9b-4079-bc97-f9397107dda6',
    '0290cdfe-c89e-4ed7-9b21-ce9b59b3b763'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'd608ed19-4b9b-4079-bc97-f9397107dda6',
    'c590d850-718b-4e7f-9dde-ef47010e2168'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'd608ed19-4b9b-4079-bc97-f9397107dda6',
    'bfb8e968-3069-415a-b544-6d1ccaf9a25f'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'd608ed19-4b9b-4079-bc97-f9397107dda6',
    'b47e358a-a6c5-43ba-81f2-d4626aa10dbf'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '0efa0341-97a2-460f-a519-f02998c02c8e',
    'd608ed19-4b9b-4079-bc97-f9397107dda6'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '3dc1a663-a45d-4dea-9fb1-06dce351f8eb',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202307006',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    'A5466033-4943-4367-9A4F-863EFDF2FAE7',
    '2023-07-06T04:14:26.452Z',
    '2023-07-06T04:14:26.452Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a253814d-2ef5-4321-96ff-301967b6509b',
    NULL,
    false,
    false,
    '69cd3e90-106e-4b9c-8419-148c29e1738a',
    '5c1395c9-ac1c-4d1b-9f06-29811a4c178b',
    'um að forseti Íslands sé kominn heim og tekinn við stjórnarstörfum.',
    '2023-08-02T23:59:26.718Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '3dc1a663-a45d-4dea-9fb1-06dce351f8eb',
    'DD163E73-6669-4E1F-9B4D-21B9C0677CC3'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'c4c24ad9-f78d-4131-9b2f-dc2e9a3a49c8',
    'Jóhanna Pétursdóttir',
    NULL,
    NULL,
    'Utanríkisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'df45241a-f37f-4746-9c30-710b926abba9',
    'Elín Oddný Oddardóttir',
    NULL,
    NULL,
    'Umhverfis-, orku og loftslagsráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'e7e4218a-f2de-4ec1-9064-13a648aee066',
    'Pétur Pétursson',
    NULL,
    NULL,
    'Utanríkisráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'db2b205b-bbbd-42a4-9fad-9e506ad6c191',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2023-07-06T04:14:26.452Z',
    'Hólaskóli - Háskólinn á Hólum',
    'A5466033-4943-4367-9A4F-863EFDF2FAE7',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'db2b205b-bbbd-42a4-9fad-9e506ad6c191',
    'c4c24ad9-f78d-4131-9b2f-dc2e9a3a49c8'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'db2b205b-bbbd-42a4-9fad-9e506ad6c191',
    'df45241a-f37f-4746-9c30-710b926abba9'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'db2b205b-bbbd-42a4-9fad-9e506ad6c191',
    'e7e4218a-f2de-4ec1-9064-13a648aee066'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '3dc1a663-a45d-4dea-9fb1-06dce351f8eb',
    'db2b205b-bbbd-42a4-9fad-9e506ad6c191'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '5f7ccf0e-57ef-4fa6-b0e8-57bf28c4f1d7',
    'Valgerður Valgerður Oddardóttir',
    NULL,
    NULL,
    'Sendiherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '15fe9f59-8c01-46ee-8f52-71d506278fc3',
    'Perla Unnarsdóttir',
    NULL,
    'Matvælaráðherra ',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'cf6032d8-d351-4d6d-9bb9-43def84f008e',
    'Oddur Stefánsson',
    NULL,
    NULL,
    'Heilbrigðisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '812e1581-515f-4e2f-9b53-e0de26e66eae',
    'Nína Úlfarsdóttir',
    NULL,
    NULL,
    'Utanríkisráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '9d79b77d-b94c-4935-963d-bebd1231bd3c',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2023-07-06T04:14:26.452Z',
    'Kvennaskólinn í Reykjavík',
    'A5466033-4943-4367-9A4F-863EFDF2FAE7',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '9d79b77d-b94c-4935-963d-bebd1231bd3c',
    '5f7ccf0e-57ef-4fa6-b0e8-57bf28c4f1d7'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '9d79b77d-b94c-4935-963d-bebd1231bd3c',
    '15fe9f59-8c01-46ee-8f52-71d506278fc3'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '9d79b77d-b94c-4935-963d-bebd1231bd3c',
    'cf6032d8-d351-4d6d-9bb9-43def84f008e'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '9d79b77d-b94c-4935-963d-bebd1231bd3c',
    '812e1581-515f-4e2f-9b53-e0de26e66eae'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '3dc1a663-a45d-4dea-9fb1-06dce351f8eb',
    '9d79b77d-b94c-4935-963d-bebd1231bd3c'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '3c63ae5e-cca6-4276-bcc4-c2e4d3e5db66',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202403030',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    'D687B9C0-A3E1-4F6B-8461-413A785A8D82',
    '2024-03-30T03:51:44.083Z',
    '2024-03-30T03:51:44.083Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    true,
    false,
    '637291f2-f7f4-405d-8586-ef88b59cab00',
    'a4669e13-4144-4b08-a811-cbd96b2e7122',
    'um greiðsluþátttöku Tryggingastofnunar ríkisins vegna þjónustu sjálfstætt starfandi sérfræðinga í hjartalækningum.',
    '2024-03-31T07:55:45.029Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '3c63ae5e-cca6-4276-bcc4-c2e4d3e5db66',
    '482A42C0-859B-4837-A0BC-560D7F88A472'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '3c63ae5e-cca6-4276-bcc4-c2e4d3e5db66',
    '5B7BDA0C-0360-49DB-95B0-2F53B9FE1EE2'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '3c63ae5e-cca6-4276-bcc4-c2e4d3e5db66',
    '2E64F42C-8BF0-4F64-97FF-91F2475A3BFD'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '3c63ae5e-cca6-4276-bcc4-c2e4d3e5db66',
    'A9F67E59-A8E5-425E-A50F-A730614C5E22'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '431f9ec1-4a4e-450f-a0c7-385095308f4c',
    'Jón Stefán Ingimarsson',
    NULL,
    'Fjármála- og efnahagsráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'b4384a3b-7e6a-48be-8fc1-fb686b7b3fe1',
    'Björn Tómasson',
    NULL,
    NULL,
    'Bankaráðsmaður'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '0852ab17-b471-4de4-9842-e4d23462a14b',
    'Einar Úlfarsson',
    NULL,
    NULL,
    'Þingmaður'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '0b8531d1-7031-47d8-b1c9-f7c36e29e95d',
    'Margrét Stefánsdóttir',
    NULL,
    'Þingmaður',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'c3b85992-1bec-4c6b-8701-d54bfb0c67e8',
    'Ingimar Úlfar Unnarsson',
    NULL,
    NULL,
    'Aðstoðarframkvæmdarstjóri'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '8134c95b-bee5-4614-80eb-2225e346907e',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2024-03-30T03:51:44.083Z',
    'Ráðgjafar- og greiningarstöð',
    'D687B9C0-A3E1-4F6B-8461-413A785A8D82',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '8134c95b-bee5-4614-80eb-2225e346907e',
    '431f9ec1-4a4e-450f-a0c7-385095308f4c'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '8134c95b-bee5-4614-80eb-2225e346907e',
    'b4384a3b-7e6a-48be-8fc1-fb686b7b3fe1'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '8134c95b-bee5-4614-80eb-2225e346907e',
    '0852ab17-b471-4de4-9842-e4d23462a14b'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '8134c95b-bee5-4614-80eb-2225e346907e',
    '0b8531d1-7031-47d8-b1c9-f7c36e29e95d'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '8134c95b-bee5-4614-80eb-2225e346907e',
    'c3b85992-1bec-4c6b-8701-d54bfb0c67e8'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '3c63ae5e-cca6-4276-bcc4-c2e4d3e5db66',
    '8134c95b-bee5-4614-80eb-2225e346907e'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '651f2866-a24e-4ed7-a963-c90cbaec0ccc',
    'Davíð Ingimarsson',
    NULL,
    'Félags- og vinnumálaráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'c06a1687-8455-4c93-9e80-60f9b18ae3ce',
    'Njáll Unnarsson',
    NULL,
    NULL,
    'Varaseðlabankastjóri'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '217947bc-3600-4080-b38f-0279fcc6f8c0',
    'Karl Tómas Björnsson',
    NULL,
    NULL,
    'Fjármála- og efnahagsráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '0ec7d358-a48c-4cbc-a47d-6b0bf69fcd32',
    'Ösp Bryndís Valdimarsdóttir',
    NULL,
    NULL,
    'Fjármála- og efnahagsráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'b17aa2e9-78d2-410f-b179-d6479d708e03',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2024-03-30T03:51:44.083Z',
    'Landhelgisgæsla Íslands',
    'D687B9C0-A3E1-4F6B-8461-413A785A8D82',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'b17aa2e9-78d2-410f-b179-d6479d708e03',
    '651f2866-a24e-4ed7-a963-c90cbaec0ccc'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'b17aa2e9-78d2-410f-b179-d6479d708e03',
    'c06a1687-8455-4c93-9e80-60f9b18ae3ce'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'b17aa2e9-78d2-410f-b179-d6479d708e03',
    '217947bc-3600-4080-b38f-0279fcc6f8c0'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'b17aa2e9-78d2-410f-b179-d6479d708e03',
    '0ec7d358-a48c-4cbc-a47d-6b0bf69fcd32'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '3c63ae5e-cca6-4276-bcc4-c2e4d3e5db66',
    'b17aa2e9-78d2-410f-b179-d6479d708e03'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '824e17af-af90-4ac7-9dbb-3ca73c842eec',
    'Guðrún Njálsdóttir',
    NULL,
    'Framkvæmdarstjóri',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'b2fdfd93-627b-480b-8561-48e0a5016bb9',
    'Fanney Þórdís Ragnarsdóttir',
    NULL,
    NULL,
    'Forsætisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '1359e398-f37c-4a78-938c-aad96a79f1d6',
    'Magnús Lárusson',
    NULL,
    NULL,
    'Umhverfis-, orku og loftslagsráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '450e3a45-3084-4622-a3bf-0020a4bffa1b',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2024-03-30T03:51:44.083Z',
    'Seðlabanki Íslands (C-hluta stofnun)',
    'D687B9C0-A3E1-4F6B-8461-413A785A8D82',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '450e3a45-3084-4622-a3bf-0020a4bffa1b',
    '824e17af-af90-4ac7-9dbb-3ca73c842eec'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '450e3a45-3084-4622-a3bf-0020a4bffa1b',
    'b2fdfd93-627b-480b-8561-48e0a5016bb9'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '450e3a45-3084-4622-a3bf-0020a4bffa1b',
    '1359e398-f37c-4a78-938c-aad96a79f1d6'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '3c63ae5e-cca6-4276-bcc4-c2e4d3e5db66',
    '450e3a45-3084-4622-a3bf-0020a4bffa1b'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '7896e909-eab8-4047-b73c-700f66e80034',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202203017',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '480853f2-a511-41b5-b663-df655741e77a',
    '652DC100-10F3-4E8B-948C-3751EA760DAB',
    '2022-03-17T00:11:09.308Z',
    '2022-03-17T00:11:09.308Z',
    false,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    '904d562b-079c-4419-8019-c054fb422892',
    NULL,
    false,
    false,
    '69cd3e90-106e-4b9c-8419-148c29e1738a',
    'd3dbfead-749d-4a0b-9c6b-217dcd0d48be',
    'um umhverfismat áætlana.',
    '2022-03-19T09:36:26.025Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '7896e909-eab8-4047-b73c-700f66e80034',
    'CA4AF982-F7E3-491F-A9AA-53BB9615F29A'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '7896e909-eab8-4047-b73c-700f66e80034',
    'A9F67E59-A8E5-425E-A50F-A730614C5E22'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '7896e909-eab8-4047-b73c-700f66e80034',
    'A1BD5DB3-7D35-4F49-AC60-2FEDD096F824'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '7896e909-eab8-4047-b73c-700f66e80034',
    'BC6C2E21-3547-4981-8C18-DE0303BA376A'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'fba4fff9-1057-49bb-847d-2b7ae8783580',
    'Ösp Anna Ögmundardóttir',
    NULL,
    'Þingmaður',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '053f83b1-a455-47ad-b3a1-fc26714884aa',
    'Njáll Hjaltason',
    NULL,
    'Menningar- og viðskiptaráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'effa3ab0-9f5a-49a9-933f-0d4a3e04dfa4',
    'Fanney Úlfarsdóttir',
    NULL,
    NULL,
    'Dómari'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '3f17dda1-0752-472d-8a47-2f1fe62c52e7',
    'Lilja Valdimarsdóttir',
    NULL,
    NULL,
    'Háskóla-, iðnaða- og nýsköpunarráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '2b2064f1-40a5-47ab-8146-02b28b83542d',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2022-03-17T00:11:09.308Z',
    'Tilraunastöð Háskóla Íslands í meinafræði að Keldum',
    '652DC100-10F3-4E8B-948C-3751EA760DAB',
    'fba4fff9-1057-49bb-847d-2b7ae8783580',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '2b2064f1-40a5-47ab-8146-02b28b83542d',
    'fba4fff9-1057-49bb-847d-2b7ae8783580'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '2b2064f1-40a5-47ab-8146-02b28b83542d',
    '053f83b1-a455-47ad-b3a1-fc26714884aa'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '2b2064f1-40a5-47ab-8146-02b28b83542d',
    'effa3ab0-9f5a-49a9-933f-0d4a3e04dfa4'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '2b2064f1-40a5-47ab-8146-02b28b83542d',
    '3f17dda1-0752-472d-8a47-2f1fe62c52e7'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '7896e909-eab8-4047-b73c-700f66e80034',
    '2b2064f1-40a5-47ab-8146-02b28b83542d'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'c296b303-88f4-461e-84cb-170c8f0689b0',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202304018',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '1CC5CD25-D5F4-408C-8040-52DB93D0BD03',
    '2023-04-18T11:39:19.420Z',
    '2023-04-18T11:39:19.420Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    true,
    false,
    '69cd3e90-106e-4b9c-8419-148c29e1738a',
    '666be1ea-2a33-4f11-9040-6e170e660461',
    'um faggildingu o. fl.',
    '2023-05-02T09:24:38.068Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'c296b303-88f4-461e-84cb-170c8f0689b0',
    '0E74EB7E-25FA-4A8D-8CDB-C4F1B17B3CE7'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'c296b303-88f4-461e-84cb-170c8f0689b0',
    '7F26A170-8F4B-4B01-BE86-888BDF80C55C'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'c296b303-88f4-461e-84cb-170c8f0689b0',
    '05C1B19B-5DC0-4E9F-982E-FC48E5E8093F'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '9a936ceb-ee25-4947-9b14-780c0db8e984',
    'Bryndís Þórdís Andradóttir',
    NULL,
    NULL,
    'Forsætisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'ce74cf44-1232-422e-8c5a-38e9d8fcb65f',
    'Unnar Andrason',
    NULL,
    NULL,
    'Dómari'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '6ad38d56-3059-4393-af48-aabe565690c9',
    'Þórdís Ragnheiður Tómasdóttir',
    NULL,
    NULL,
    'Stjórnarmenn'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '2391b658-0155-4286-963c-93dee020bf53',
    'Unnur Jóhanna Oddardóttir',
    NULL,
    NULL,
    'Háskóla-, iðnaða- og nýsköpunarráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '86e56dbf-a071-47df-b9ea-90c49a2ca776',
    'Valdimar Stefán Jónsson',
    NULL,
    NULL,
    'Framkvæmdarstjóri'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'be745395-2f63-4778-a708-d204f6c0f1be',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2023-04-18T11:39:19.420Z',
    'Héraðsdómur Austurlands',
    '1CC5CD25-D5F4-408C-8040-52DB93D0BD03',
    '9a936ceb-ee25-4947-9b14-780c0db8e984',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'be745395-2f63-4778-a708-d204f6c0f1be',
    '9a936ceb-ee25-4947-9b14-780c0db8e984'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'be745395-2f63-4778-a708-d204f6c0f1be',
    'ce74cf44-1232-422e-8c5a-38e9d8fcb65f'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'be745395-2f63-4778-a708-d204f6c0f1be',
    '6ad38d56-3059-4393-af48-aabe565690c9'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'be745395-2f63-4778-a708-d204f6c0f1be',
    '2391b658-0155-4286-963c-93dee020bf53'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'be745395-2f63-4778-a708-d204f6c0f1be',
    '86e56dbf-a071-47df-b9ea-90c49a2ca776'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'c296b303-88f4-461e-84cb-170c8f0689b0',
    'be745395-2f63-4778-a708-d204f6c0f1be'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '9c3f1323-0544-4444-af79-9eeda09930a3',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202310018',
    'a90d65b7-905f-4ebb-aa1d-7fa115d91d56',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '354F3694-8CE6-49E9-9053-6F5B61BE7151',
    '2023-10-18T14:24:38.894Z',
    '2023-10-18T14:24:38.894Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    'cabd738c-a82e-44ab-a1fb-ec428f951ad1',
    'um úthlutun á tollkvótum vegna innflutnings á nautgripa-, svína-, alifugla- og hreindýrakjöti.',
    '2023-10-27T14:04:51.109Z',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '7f806452-2240-433a-80df-625d024a994d',
    'Fanney Ólöf Þorsteinsdóttir',
    NULL,
    'Félags- og vinnumálaráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'e5f53ed0-006a-4eb9-9f14-5a51f8967382',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2023-10-18T14:24:38.894Z',
    'Heilbrigðisstofnun Norðurlands',
    '354F3694-8CE6-49E9-9053-6F5B61BE7151',
    '7f806452-2240-433a-80df-625d024a994d',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'e5f53ed0-006a-4eb9-9f14-5a51f8967382',
    '7f806452-2240-433a-80df-625d024a994d'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '9c3f1323-0544-4444-af79-9eeda09930a3',
    'e5f53ed0-006a-4eb9-9f14-5a51f8967382'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    'a08f6b91-4d75-4e6b-ac38-e751da1a23e3',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202309026',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    'FAF58296-777A-487B-87DB-1A1AE9AD8CFC',
    '2023-09-26T04:33:42.972Z',
    '2023-09-26T04:33:42.972Z',
    true,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    '01b1e30a-a3e9-4499-aae5-379c8f965dd2',
    NULL,
    false,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um gildistöku ákvörðunar Flugmálastjórnar Íslands nr. 6/2005.',
    '2023-09-29T21:58:49.892Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'a08f6b91-4d75-4e6b-ac38-e751da1a23e3',
    '07FAFC03-9393-4257-9D10-B97C59CD1E94'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'a08f6b91-4d75-4e6b-ac38-e751da1a23e3',
    'DE8AC9BA-DF73-4353-A353-0E7F2D843D36'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'a08f6b91-4d75-4e6b-ac38-e751da1a23e3',
    'E7ADFD6A-9DBA-4455-9A4D-B57A7D9AF556'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'a08f6b91-4d75-4e6b-ac38-e751da1a23e3',
    '15A9CF07-71E5-445B-A2E4-1250F9FE870D'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    'a08f6b91-4d75-4e6b-ac38-e751da1a23e3',
    '0F7CE1AD-38BF-4895-ACA6-61924C5E6EDA'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '65b5bdce-a935-4057-8876-31d6287f7a87',
    'Unnur Oddný Davíðsdóttir',
    NULL,
    'Varaseðlabankastjóri',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '39b0ad9d-dd85-41b5-80df-0900fbe850ac',
    'Jón Finnur Björnsson',
    NULL,
    NULL,
    'Sendiherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '12f138c8-9fd0-4400-97fc-70c45ae83a71',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2023-09-26T04:33:42.972Z',
    'Landbúnaðarháskóli Íslands',
    'FAF58296-777A-487B-87DB-1A1AE9AD8CFC',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '12f138c8-9fd0-4400-97fc-70c45ae83a71',
    '65b5bdce-a935-4057-8876-31d6287f7a87'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '12f138c8-9fd0-4400-97fc-70c45ae83a71',
    '39b0ad9d-dd85-41b5-80df-0900fbe850ac'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'a08f6b91-4d75-4e6b-ac38-e751da1a23e3',
    '12f138c8-9fd0-4400-97fc-70c45ae83a71'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'd586473c-548e-4052-951d-5b8e48bb7fbb',
    'Einar Yngvason',
    NULL,
    NULL,
    'Dómsmálaráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'e6aef647-3e67-4232-9d69-638c1aac74a4',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2023-09-26T04:33:42.972Z',
    'Ríkiskaup',
    'FAF58296-777A-487B-87DB-1A1AE9AD8CFC',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'e6aef647-3e67-4232-9d69-638c1aac74a4',
    'd586473c-548e-4052-951d-5b8e48bb7fbb'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    'a08f6b91-4d75-4e6b-ac38-e751da1a23e3',
    'e6aef647-3e67-4232-9d69-638c1aac74a4'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '7fa53a59-99d2-4b5f-8d67-1f75ac52a5e2',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202303017',
    '22b038c1-1d8b-4a01-b061-02f22358d17e',
    'ec3849a2-2405-4459-a9e3-baf17f894e7b',
    '2A9167F6-09B1-4040-9263-1E11141079F0',
    '2023-03-17T13:53:38.459Z',
    '2023-03-17T13:53:38.459Z',
    false,
    '3d918322-8e60-44ad-be5e-7485d0e45cdd',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'gatnagerðargjalda á Akureyri.',
    '2023-03-22T03:36:13.520Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '7fa53a59-99d2-4b5f-8d67-1f75ac52a5e2',
    'AB540571-82F5-4BCC-B4CB-A8F9D83321AB'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '7fa53a59-99d2-4b5f-8d67-1f75ac52a5e2',
    '3438DB42-D371-4D2F-A7AC-D28A756A57DD'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '7fa53a59-99d2-4b5f-8d67-1f75ac52a5e2',
    '5C1B8217-F825-40E4-AD9C-CF5D3015FA8F'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'aa716b9d-010e-4474-87c3-9e04e8147462',
    'Sigríður Karlsdóttir',
    NULL,
    NULL,
    'Dómari'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '623cf5db-e815-4724-9e10-e6895b2d3b8c',
    'Ýmir Lárusson',
    NULL,
    'Aðstoðarframkvæmdarstjóri',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '6c1a81d4-84da-4108-bc72-96b3258713a8',
    'Úlfar Björn Úlfarsson',
    NULL,
    NULL,
    'Utanríkisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'ca3e845f-6ae3-4165-8e22-c03952d035be',
    'Gunnar Þorsteinsson',
    NULL,
    NULL,
    'Félags- og vinnumálaráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'b293eee3-964c-41ff-bd3f-35db34145406',
    'Davíð Oddur Hjaltason',
    NULL,
    NULL,
    'Heilbrigðisráðherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'cb30c33c-2a33-4710-8a70-2bad3de85cea',
    '1b15e5a8-a548-4d0e-a79f-0c8d50520d29',
    '2023-03-17T13:53:38.459Z',
    'Fiskistofa',
    '2A9167F6-09B1-4040-9263-1E11141079F0',
    NULL,
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'cb30c33c-2a33-4710-8a70-2bad3de85cea',
    'aa716b9d-010e-4474-87c3-9e04e8147462'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'cb30c33c-2a33-4710-8a70-2bad3de85cea',
    '623cf5db-e815-4724-9e10-e6895b2d3b8c'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'cb30c33c-2a33-4710-8a70-2bad3de85cea',
    '6c1a81d4-84da-4108-bc72-96b3258713a8'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'cb30c33c-2a33-4710-8a70-2bad3de85cea',
    'ca3e845f-6ae3-4165-8e22-c03952d035be'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'cb30c33c-2a33-4710-8a70-2bad3de85cea',
    'b293eee3-964c-41ff-bd3f-35db34145406'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '7fa53a59-99d2-4b5f-8d67-1f75ac52a5e2',
    'cb30c33c-2a33-4710-8a70-2bad3de85cea'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '6ef16f57-df0e-45fa-98c2-d10349c44bcb',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2023',
    '202401029',
    '799722be-5530-439a-91dc-606e129b030d',
    '08f2c487-2407-470b-bef3-72c9e0afb328',
    'A3F0FB27-0CB5-4EC7-8C01-A9BC3A02FF4C',
    '2024-01-29T04:52:46.488Z',
    '2024-01-29T04:52:46.488Z',
    false,
    NULL,
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    false,
    false,
    '637291f2-f7f4-405d-8586-ef88b59cab00',
    '052d2c60-8fc1-4785-8e21-4993eb60adc0',
    'um breytingu á deiliskipulagi lóðarinnar að Sundstræti 36, Ísafirði, Ísafjarðarbæ.',
    '2024-02-14T04:22:09.689Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '6ef16f57-df0e-45fa-98c2-d10349c44bcb',
    'CCF1A16B-788C-426E-B16C-C9BDE4CDFEB4'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '6ef16f57-df0e-45fa-98c2-d10349c44bcb',
    '752EADD5-1523-4983-A926-11AB62A83024'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '6ef16f57-df0e-45fa-98c2-d10349c44bcb',
    '17C04CAB-FDBA-4B72-8D24-0F5F50C3E314'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '6ef16f57-df0e-45fa-98c2-d10349c44bcb',
    '3DC2EF5D-7DB0-4054-BAC8-F718950594E0'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '6ef16f57-df0e-45fa-98c2-d10349c44bcb',
    '5D451470-17B4-449E-AD97-34CBEA1B2CFA'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '470d7919-9307-4c82-b001-60bec957a7b2',
    'Yngvi Einarsson',
    NULL,
    'Heilbrigðisráðherra',
    NULL
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '1ee48775-595b-4e0a-856f-18619f00c01a',
    'Sigríður Þorsteinsdóttir',
    NULL,
    NULL,
    'Dómari'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'd83cf464-db5e-40f6-abb0-135d21d32913',
    'Ólöf Ösp Einarsdóttir',
    NULL,
    NULL,
    'Sendiherra'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    'eb9998ae-1fde-4809-a8fe-bfa8f6366143',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2024-01-29T04:52:46.488Z',
    'Tryggingastofnun ríkisins',
    'A3F0FB27-0CB5-4EC7-8C01-A9BC3A02FF4C',
    '470d7919-9307-4c82-b001-60bec957a7b2',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'eb9998ae-1fde-4809-a8fe-bfa8f6366143',
    '470d7919-9307-4c82-b001-60bec957a7b2'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'eb9998ae-1fde-4809-a8fe-bfa8f6366143',
    '1ee48775-595b-4e0a-856f-18619f00c01a'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    'eb9998ae-1fde-4809-a8fe-bfa8f6366143',
    'd83cf464-db5e-40f6-abb0-135d21d32913'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '6ef16f57-df0e-45fa-98c2-d10349c44bcb',
    'eb9998ae-1fde-4809-a8fe-bfa8f6366143'
  );

INSERT INTO
  CASE_CASE (
    ID,
    APPLICATION_ID,
    YEAR,
    CASE_NUMBER,
    STATUS_ID,
    TAG_ID,
    INVOLVED_PARTY_ID,
    CREATED_AT,
    UPDATED_AT,
    IS_LEGACY,
    ASSIGNED_USER_ID,
    CASE_COMMUNICATION_STATUS_ID,
    PRICE,
    PAID,
    FAST_TRACK,
    DEPARTMENT_ID,
    ADVERT_TYPE_ID,
    ADVERT_TITLE,
    ADVERT_REQUESTED_PUBLICATION_DATE,
    MESSAGE
  )
VALUES
  (
    '45be6df1-ed0f-4247-8915-8a59a9a5a63c',
    '8fb627ec-fe9c-4f59-b3df-2c33b8f47597',
    '2022',
    '202206015',
    'e926beb2-4001-4315-aed9-e4eec2ca963d',
    '480853f2-a511-41b5-b663-df655741e77a',
    '99603AA4-9DB8-43F5-A336-434DF87DAECD',
    '2022-06-15T03:10:13.513Z',
    '2022-06-15T03:10:13.513Z',
    true,
    '21140e6b-e272-4d78-b085-dbc3190b2a0a',
    'a96edcf2-97c5-427d-99e5-8de76c887e07',
    NULL,
    true,
    false,
    '472af28c-5f60-48b4-81f5-4bb4254dd74d',
    '38ab9b3d-b0d5-4d05-87be-60a73af20af9',
    'um evrópsk samvinnufélög.',
    '2022-07-07T15:15:39.525Z',
    NULL
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '45be6df1-ed0f-4247-8915-8a59a9a5a63c',
    '0F7BA61D-371B-4FEA-84DD-85830A63C6B4'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '45be6df1-ed0f-4247-8915-8a59a9a5a63c',
    'FE3610B6-189E-4D99-89DA-16FEA7919757'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '45be6df1-ed0f-4247-8915-8a59a9a5a63c',
    '33FF9B2E-D4BD-4F3A-A026-7E29EFB1E775'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '45be6df1-ed0f-4247-8915-8a59a9a5a63c',
    '28C2854B-16EB-407E-9F8E-80238765BA89'
  );

INSERT INTO
  case_categories(case_case_id, category_id)
VALUES
  (
    '45be6df1-ed0f-4247-8915-8a59a9a5a63c',
    'D7CA4220-43B9-44B2-BF54-E840AE164B63'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '5c129cd5-67bb-4c0f-a81d-6acf071e8fdd',
    'Úlfhildur Björnsdóttir',
    NULL,
    NULL,
    'Fjármála- og efnahagsráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'a02ad20b-52f7-4b02-99db-9e720fbf1cd6',
    'Ingimar Ragnarsson',
    NULL,
    NULL,
    'Aðstoðarframkvæmdarstjóri'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'b33fe498-8ef6-411d-9ff8-65af471af5ea',
    'Perla Tómasdóttir',
    NULL,
    NULL,
    'Umhverfis-, orku og loftslagsráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    'bf15fd1f-c9dc-4e83-8373-15dbeb714b9a',
    'Hjalti Hjalti Karlsson',
    NULL,
    NULL,
    'Heilbrigðisráðherra'
  );

INSERT INTO
  SIGNATURE_MEMBER (
    ID,
    VALUE,
    TEXT_ABOVE,
    TEXT_BELOW,
    TEXT_AFTER
  )
VALUES
  (
    '7d578025-a83b-42d6-aa0a-9b92bdb8bf7c',
    'Valdimar Davíð Karlsson',
    NULL,
    NULL,
    'Aðstoðarframkvæmdarstjóri'
  );

INSERT INTO
  SIGNATURE (
    ID,
    TYPE_ID,
    DATE,
    INSTITUTION,
    INVOLVED_PARTY_ID,
    CHAIRMAN_ID,
    ADDITIONAL_SIGNATURE,
    HTML
  )
VALUES
  (
    '98228447-c5cb-4ba4-be6a-72cca7a80dc9',
    'b8b85c12-9d08-4267-9e4e-d6ae8b34ef4e',
    '2022-06-15T03:10:13.513Z',
    'Landskjörstjórn',
    '99603AA4-9DB8-43F5-A336-434DF87DAECD',
    '5c129cd5-67bb-4c0f-a81d-6acf071e8fdd',
    NULL,
    '<div>Signature</div>'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '98228447-c5cb-4ba4-be6a-72cca7a80dc9',
    '5c129cd5-67bb-4c0f-a81d-6acf071e8fdd'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '98228447-c5cb-4ba4-be6a-72cca7a80dc9',
    'a02ad20b-52f7-4b02-99db-9e720fbf1cd6'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '98228447-c5cb-4ba4-be6a-72cca7a80dc9',
    'b33fe498-8ef6-411d-9ff8-65af471af5ea'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '98228447-c5cb-4ba4-be6a-72cca7a80dc9',
    'bf15fd1f-c9dc-4e83-8373-15dbeb714b9a'
  );

INSERT INTO
  SIGNATURE_MEMBERS (
    SIGNATURE_ID,
    SIGNATURE_MEMBER_ID
  )
VALUES
  (
    '98228447-c5cb-4ba4-be6a-72cca7a80dc9',
    '7d578025-a83b-42d6-aa0a-9b92bdb8bf7c'
  );

INSERT INTO
  CASE_SIGNATURES (CASE_CASE_ID, SIGNATURE_ID)
VALUES
  (
    '45be6df1-ed0f-4247-8915-8a59a9a5a63c',
    '98228447-c5cb-4ba4-be6a-72cca7a80dc9'
  );
