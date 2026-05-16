-- Run: ALTER TABLE badges ADD COLUMN IF NOT EXISTS category VARCHAR(50);
-- before applying this seed if upgrading an existing database.

INSERT INTO badges (name, description, icon_url, criteria, category) VALUES

-- Explorer: volume of sightings logged
('First Find',         'Log your first sighting',              NULL, 'sightings_count >= 1',    'explorer'),
('Naturalist',         'Log 10 sightings',                     NULL, 'sightings_count >= 10',   'explorer'),
('Field Expert',       'Log 50 sightings',                     NULL, 'sightings_count >= 50',   'explorer'),
('Seasoned Observer',  'Log 100 sightings',                    NULL, 'sightings_count >= 100',  'explorer'),
('Wild Century',       'Log 250 sightings',                    NULL, 'sightings_count >= 250',  'explorer'),
('Thousand Sightings', 'Log 1,000 sightings — a true field naturalist',
                                                               NULL, 'sightings_count >= 1000', 'explorer'),

-- Life List: unique species identified
('Curious Mind',       'Identify 5 unique species',            NULL, 'species_count >= 5',      'life_list'),
('Species Hunter',     'Identify 25 unique species',           NULL, 'species_count >= 25',     'life_list'),
('Encyclopaedia',      'Identify 50 unique species',           NULL, 'species_count >= 50',     'life_list'),
('Wild Almanac',       'Identify 100 unique species',          NULL, 'species_count >= 100',    'life_list'),
('Living Field Guide', 'Identify 200 unique species',          NULL, 'species_count >= 200',    'life_list'),

-- Kingdom: birds
('Birder',             'Identify 10 bird species',             NULL, 'bird_species_count >= 10',  'kingdom'),
('Master Birder',      'Identify 25 bird species',             NULL, 'bird_species_count >= 25',  'kingdom'),
('Flock Watcher',      'Identify 50 bird species',             NULL, 'bird_species_count >= 50',  'kingdom'),

-- Kingdom: plants
('Botanist',           'Identify 10 plant species',            NULL, 'plant_species_count >= 10', 'kingdom'),
('Plant Doctor',       'Identify 25 plant species',            NULL, 'plant_species_count >= 25', 'kingdom'),

-- Kingdom: fungi
('Fungi Finder',       'Identify 5 fungi species',             NULL, 'fungi_species_count >= 5',  'kingdom'),
('Mycelium Master',    'Identify 15 fungi species',            NULL, 'fungi_species_count >= 15', 'kingdom'),

-- Kingdom: insects
('Insect Eye',         'Identify 5 insect species',            NULL, 'insect_species_count >= 5',  'kingdom'),
('Entomologist',       'Identify 20 insect species',           NULL, 'insect_species_count >= 20', 'kingdom'),

-- Kingdom: mammals
('Mammal Watch',       'Identify 5 mammal species',            NULL, 'mammal_species_count >= 5',  'kingdom'),
('Beast Master',       'Identify 15 mammal species',           NULL, 'mammal_species_count >= 15', 'kingdom'),

-- Kingdom: reptiles
('Reptile Spotter',    'Identify 3 reptile species',           NULL, 'reptile_species_count >= 3',    'kingdom'),
('Cold Blooded',       'Identify 8 reptile species',           NULL, 'reptile_species_count >= 8',    'kingdom'),

-- Kingdom: amphibians
('Puddle Hunter',      'Identify 3 amphibian species',         NULL, 'amphibian_species_count >= 3',  'kingdom'),

-- Kingdom: fish
('River Reader',       'Identify 5 fish species',              NULL, 'fish_species_count >= 5',       'kingdom'),

-- Rarity Hunter: rare and uncommon species
('Uncommon Eye',       'Identify 5 uncommon species',          NULL, 'uncommon_species_count >= 5',   'rarity'),
('Lucky Find',         'Identify a rare or very rare species', NULL, 'rare_species_count >= 1',       'rarity'),
('Rarity Chaser',      'Identify 5 rare or very rare species', NULL, 'rare_species_count >= 5',       'rarity'),
('Rare Spotter',       'Identify 3 very rare species',         NULL, 'very_rare_species_count >= 3',  'rarity'),
('Legendary Find',     'Identify 5 very rare species',         NULL, 'very_rare_species_count >= 5',  'rarity'),
('Ultra Rare',         'Identify 10 very rare species',        NULL, 'very_rare_species_count >= 10', 'rarity'),

-- Conservation Champion: at-risk species
('Guardian',           'Identify an endangered or critically endangered species',
                                                               NULL, 'endangered_species_count >= 1', 'conservation'),
('Advocate',           'Identify 3 endangered species',        NULL, 'endangered_species_count >= 3', 'conservation'),
('Red List Ranger',    'Identify 5 vulnerable or worse species',
                                                               NULL, 'at_risk_species_count >= 5',    'conservation'),
('Species Sentinel',   'Identify 10 at-risk species (vulnerable, endangered, or critically endangered)',
                                                               NULL, 'at_risk_species_count >= 10',   'conservation')

ON CONFLICT (name) DO UPDATE
  SET description = EXCLUDED.description,
      criteria    = EXCLUDED.criteria,
      category    = EXCLUDED.category;
