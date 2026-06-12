INSERT INTO categories (name, slug, description)
VALUES
  ('Forest Honey', 'forest-honey', 'Raw honey harvested by forest communities.'),
  ('Handicrafts', 'handicrafts', 'Handmade craft, textile, and home goods.'),
  ('Millets and Grains', 'millets-grains', 'Traditional grains from small farmers.'),
  ('Herbal Wellness', 'herbal-wellness', 'Forest herbs, oils, and wellness products.')
ON CONFLICT (slug) DO NOTHING;

