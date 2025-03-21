INSERT INTO APPLICATION_FEE_CODES (FEE_CODE, DESCRIPTION, FEE_TYPE, DEPARTMENT, VALUE) VALUES
  ('A101', 'Grunngjald', 'BASE', 'a-deild', 4000),
  ('A104', 'Viðbótarskjöl', 'ADDITIONAL_DOC', 'a-deild', 15000),
  ('A106', 'Álag vegna mikillar vinnu við mál', 'CUSTOM_MULTIPLIER', 'a-deild', 0), -- Custom value
  ('A107', 'Upphæð vegna flýtibirtingar', 'FAST_TRACK', 'a-deild', 1.8),
  ('B101', 'Grunngjald', 'BASE', 'b-deild', 9000),
  ('B102', '% yfir grunngjald', 'BASE_MODIFIER', 'b-deild', 2),
  ('B104', 'Viðbótarskjöl', 'ADDITIONAL_DOC', 'b-deild', 15000),
  ('B106', 'Álag vegna mikillar vinnu við mál', 'CUSTOM_MULTIPLIER', 'b-deild', 0), -- Custom value
  ('B107', 'Upphæð vegna flýtibirtingar', 'FAST_TRACK', 'b-deild', 1.8),
  ('B108', '1-5 myndir í máli', 'IMAGE_TIER', 'b-deild', 5000),
  ('B109', '6-15 myndir í máli', 'IMAGE_TIER', 'b-deild', 10000),
  ('B110', '>15 myndir í máli', 'IMAGE_TIER', 'b-deild', 15000),
  ('C101', 'Grunngjald', 'BASE', 'c-deild', 5000),
  ('C104', 'Lækkun vegna birtingar eldri mál', 'LOWERED', 'c-deild', 1500),
  ('C107', 'Upphæð vegna flýtibirtingar', 'FAST_TRACK', 'c-deild', 1.8);