INSERT INTO badges (name, description, icon_url, criteria) VALUES
('First Find',      'Log your first sighting',                                    NULL, 'sightings_count >= 1'),
('Naturalist',      'Log 10 sightings',                                           NULL, 'sightings_count >= 10'),
('Field Expert',    'Log 50 sightings',                                           NULL, 'sightings_count >= 50'),
('Curious Mind',    'Identify 5 unique species',                                  NULL, 'species_count >= 5'),
('Species Hunter',  'Identify 25 unique species',                                 NULL, 'species_count >= 25'),
('Encyclopaedia',   'Identify 50 unique species',                                 NULL, 'species_count >= 50'),
('Birder',          'Identify 10 bird species',                                   NULL, 'bird_species_count >= 10'),
('Botanist',        'Identify 10 plant species',                                  NULL, 'plant_species_count >= 10'),
('Fungi Finder',    'Identify 5 fungi species',                                   NULL, 'fungi_species_count >= 5'),
('Lucky Find',      'Identify a rare or very rare species',                       NULL, 'rare_species_count >= 1'),
('Rare Spotter',    'Identify 3 very rare species',                               NULL, 'very_rare_species_count >= 3'),
('Guardian',        'Identify an endangered or critically endangered species',     NULL, 'endangered_species_count >= 1')
ON CONFLICT (name) DO NOTHING;
