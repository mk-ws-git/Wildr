INSERT INTO species (common_name, scientific_name, kingdom, rarity_tier, conservation_status, fun_fact, habitat, behaviour, seasonal_note)
VALUES
  ('European Robin', 'Erithacus rubecula', 'bird', 'common', 'least_concern',
   'Robins are one of the few birds to sing through winter, even at night near artificial lights.',
   'Gardens, woodland edges, hedgerows, and parks across Europe and western Asia.',
   'Famously bold around humans; will follow gardeners to catch unearthed worms.',
   'Resident year-round in most of Europe; northern populations migrate south in autumn.'),

  ('House Sparrow', 'Passer domesticus', 'bird', 'common', 'least_concern',
   'House Sparrows take dust baths to help control parasites in their feathers.',
   'Urban and suburban areas worldwide, closely associated with human settlements.',
   'Highly social; forages in flocks and communicates with a wide range of chirps.',
   'Breeds spring through summer; flocks increase in size through autumn and winter.'),

  ('Mallard', 'Anas platyrhynchos', 'bird', 'common', 'least_concern',
   'The familiar "quack" sound is only made by females; males produce a quieter rasp.',
   'Lakes, rivers, ponds, wetlands, and urban parks across the Northern Hemisphere.',
   'Dabbles at the water surface rather than diving; tips up to reach submerged plants.',
   'Breeds in spring; males moult into dull eclipse plumage after breeding season.'),

  ('Blue Jay', 'Cyanocitta cristata', 'bird', 'common', 'least_concern',
   'Blue Jays can mimic the calls of hawks to scare other birds away from food sources.',
   'Forests, parks, and suburban gardens across eastern and central North America.',
   'Highly intelligent; caches thousands of acorns and seeds for winter use.',
   'Partially migratory; some populations move south in autumn while others remain.'),

  ('Barn Swallow', 'Hirundo rustica', 'bird', 'common', 'least_concern',
   'Barn Swallows can travel over 11,000 km on migration between Europe and southern Africa.',
   'Open countryside, farmland, and wetlands; nests inside barns and outbuildings.',
   'Catches insects entirely in flight, skimming low over fields and water surfaces.',
   'A classic summer visitor; arrives April–May and departs August–October.'),

  ('Great Tit', 'Parus major', 'bird', 'common', 'least_concern',
   'Great Tits have over 40 distinct call types — one of the most complex vocal repertoires of any bird.',
   'Woodland, parks, hedgerows, and gardens across Europe and Asia.',
   'Dominant at garden feeders; uses its strong bill to hammer open nuts and seeds.',
   'Resident year-round; begins singing its distinctive two-note call as early as January.'),

  ('Common Blackbird', 'Turdus merula', 'bird', 'common', 'least_concern',
   'Blackbirds are among the first birds to sing at dawn and last to stop at dusk.',
   'Woodland, parks, gardens, and hedgerows across Europe, Asia, and Australia.',
   'Forages on the ground, cocking its head to listen for earthworms beneath the soil.',
   'Sings most actively from February through July; resident year-round in most of Europe.'),

  ('Common Kingfisher', 'Alcedo atthis', 'bird', 'uncommon', 'least_concern',
   'Kingfishers have binocular vision underwater and can correct for light refraction when diving.',
   'Clear, slow-moving rivers, streams, lakes, and canals with overhanging vegetation.',
   'Perches motionless above water before plunge-diving to catch small fish.',
   'Resident year-round; may move to estuaries and coasts in cold winters when rivers freeze.'),

  ('Peregrine Falcon', 'Falco peregrinus', 'bird', 'uncommon', 'least_concern',
   'The Peregrine is the fastest animal on Earth, reaching over 320 km/h in a hunting stoop.',
   'Cliff faces, tall buildings, bridges, and open country on every continent except Antarctica.',
   'Hunts by stooping at high speed onto prey mid-air; kills with a blow from clenched talons.',
   'Resident year-round in most of range; Arctic-breeding birds migrate south in winter.'),

  ('Red Kite', 'Milvus milvus', 'bird', 'rare', 'least_concern',
   'Red Kites decorate their nests with litter and scraps of clothing — researchers use this to track nests.',
   'Open woodland, farmland, and hillsides; stronghold in Wales and reintroduced across England.',
   'Soars effortlessly on thermals; its distinctive forked tail makes it easy to identify in flight.',
   'Resident year-round in the UK; continental birds may join UK populations in winter.'),

  ('Snowy Owl', 'Bubo scandiacus', 'bird', 'rare', 'vulnerable',
   'Snowy Owls can locate prey under 60 cm of snow using hearing alone.',
   'Open Arctic tundra for breeding; winters on open farmland, marshes, and coastlines.',
   'Diurnal hunter in the 24-hour Arctic summer; hunts lemmings almost exclusively when breeding.',
   'Irruptive migrant; in lemming crash years, large numbers move south into temperate regions.'),

  ('African Penguin', 'Spheniscus demersus', 'bird', 'rare', 'endangered',
   'African Penguins make a distinctive braying call, earning them the nickname "jackass penguin".',
   'Rocky coastlines and islands of southern Africa; forages up to 100 km offshore.',
   'Monogamous; pairs return to the same nesting burrow each year and share incubation duties.',
   'Breeds year-round with peaks in April and November; moults annually over 3 weeks on shore.'),

  ('Philippine Eagle', 'Pithecophaga jefferyi', 'bird', 'very_rare', 'critically_endangered',
   'The Philippine Eagle is one of the largest and most powerful birds of prey in the world.',
   'Old-growth rainforest in the Philippines, primarily on the island of Mindanao.',
   'An apex predator; hunts flying lemurs, monkeys, and large bats through dense forest canopy.',
   'Breeds once every two years; a single chick takes over a year to fledge.'),

  ('Spoon-billed Sandpiper', 'Eurynorhynchus pygmeus', 'bird', 'very_rare', 'critically_endangered',
   'The Spoon-billed Sandpiper has a unique spatula-shaped bill found in no other bird.',
   'Breeds on coastal tundra in northeast Russia; winters on mudflats in Southeast Asia.',
   'Feeds by sweeping its spoon-shaped bill side to side through shallow water and soft mud.',
   'Makes one of the longest migrations of any shorebird, travelling over 8,000 km each way.'),

  ('Kakapo', 'Strigops habroptilus', 'bird', 'very_rare', 'critically_endangered',
   'The Kakapo is the world''s only flightless parrot and the heaviest parrot on Earth at up to 4 kg.',
   'Native forest on predator-free islands off New Zealand, managed intensively by conservation staff.',
   'Nocturnal and solitary; males boom from hilltop "leks" to attract females during breeding.',
   'Boom years are triggered by mast-seeding rimu trees, meaning breeding may not occur for years.')

ON CONFLICT (scientific_name) DO NOTHING;
