INSERT INTO APPLICATION_FEE_CODES (FEE_CODE, DESCRIPTION, FEE_TYPE, DEPARTMENT, VALUE) VALUES
  ('A101', 'Advert base fee', 'BASE', 'a-deild', 4000),
  ('A104', 'Attachment document', 'ADDITIONAL_DOC', 'a-deild', 15000),
  ('A106', '% álags vegna mikillar vinnu við mál', 'PERCENTAGE', 'a-deild', 0), -- Value?
  ('A107', '80% á upphæð vegna flýtibirtingar (innan 10 daga)', 'FAST_TRACK', 'a-deild', 1.8),
  ('B101', 'Department B base - 1000 characters included', 'BASE', 'b-deild', 9000),
  ('B102', 'Fee for each character when characters exceed base (B101)', 'BASE_MODIFIER', 'b-deild', 2),
  ('B104', 'Attachment document', 'ADDITIONAL_DOC', 'b-deild', 15000),
  ('B106', '% álags vegna mikillar vinnu við mál', 'PERCENTAGE', 'b-deild', 0), -- Value?
  ('B107', '80% á upphæð vegna flýtibirtingar (innan 10 daga)', 'FAST_TRACK', 'b-deild', 1.8),
  ('B108', '1-5 myndir í máli', 'IMAGE_TIER', 'b-deild', 5000),
  ('B109', '6-15 myndir í máli', 'IMAGE_TIER', 'b-deild', 10000),
  ('B110', '>15 myndir í máli', 'IMAGE_TIER', 'b-deild', 15000),
  ('C101', 'Department C - Base fee', 'BASE', 'c-deild', 5000),
  ('C104', 'Lækkun vegna birtingar eldri mál', 'LOWERED', 'c-deild', 1500),
  ('C107', '80% á upphæð vegna flýtibirtingar (innan 10 daga)', 'FAST_TRACK', 'c-deild', 1.8);
  