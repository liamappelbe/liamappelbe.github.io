const kAdjectives = [
  'Abrupt',        'Acidic',         'Adorable',      'Adventurous',
  'Aggressive',    'Agitated',       'Alert',         'Aloof',
  'Amiable',       'Amused',         'Annoyed',       'Antsy',
  'Anxious',       'Appalling',      'Appetizing',    'Apprehensive',
  'Arrogant',      'Ashamed',        'Astonishing',   'Attractive',
  'Average',       'Batty',          'Beefy',         'Bewildered',
  'Biting',        'Bitter',         'Bland',         'Blushing',
  'Bored',         'Brave',          'Bright',        'Broad',
  'Bulky',         'Burly',          'Charming',      'Cheeky',
  'Cheerful',      'Chubby',         'Clean',         'Clear',
  'Cloudy',        'Clueless',       'Clumsy',        'Colorful',
  'Colossal',      'Combative',      'Comfortable',   'Condemned',
  'Condescending', 'Confused',       'Contemplative', 'Convincing',
  'Convoluted',    'Cooperative',    'Corny',         'Costly',
  'Courageous',    'Crabby',         'Creepy',        'Crooked',
  'Cruel',         'Cumbersome',     'Curved',        'Cynical',
  'Dangerous',     'Dashing',        'Decayed',       'Deceitful',
  'Deep',          'Defeated',       'Defiant',       'Delicious',
  'Delightful',    'Depraved',       'Depressed',     'Despicable',
  'Determined',    'Dilapidated',    'Diminutive',    'Disgusted',
  'Distinct',      'Distraught',     'Distressed',    'Disturbed',
  'Dizzy',         'Drab',           'Drained',       'Dull',
  'Eager',         'Ecstatic',       'Elated',        'Elegant',
  'Emaciated',     'Embarrassed',    'Enchanting',    'Encouraging',
  'Energetic',     'Enormous',       'Enthusiastic',  'Envious',
  'Exasperated',   'Excited',        'Exhilarated',   'Extensive',
  'Exuberant',     'Fancy',          'Fantastic',     'Fierce',
  'Filthy',        'Flat',           'Floppy',        'Fluttering',
  'Foolish',       'Frantic',        'Fresh',         'Friendly',
  'Frightened',    'Frothy',         'Frustrating',   'Funny',
  'Fuzzy',         'Gaudy',          'Gentle',        'Ghastly',
  'Giddy',         'Gigantic',       'Glamorous',     'Gleaming',
  'Glorious',      'Gorgeous',       'Graceful',      'Greasy',
  'Grieving',      'Gritty',         'Grotesque',     'Grubby',
  'Grumpy',        'Handsome',       'Happy',         'Harebrained',
  'Healthy',       'Helpful',        'Helpless',      'High',
  'Hollow',        'Homely',         'Horrific',      'Huge',
  'Hungry',        'Hurt',           'Icy',           'Ideal',
  'Immense',       'Impressionable', 'Intrigued',     'Irate',
  'Irritable',     'Itchy',          'Jealous',       'Jittery',
  'Jolly',         'Joyous',         'Filthy',        'Flat',
  'Floppy',        'Fluttering',     'Foolish',       'Frantic',
  'Fresh',         'Friendly',       'Frightened',    'Frothy',
  'Frustrating',   'Funny',          'Fuzzy',         'Gaudy',
  'Gentle',        'Ghastly',        'Giddy',         'Gigantic',
  'Glamorous',     'Gleaming',       'Glorious',      'Gorgeous',
  'Graceful',      'Greasy',         'Grieving',      'Gritty',
  'Grotesque',     'Grubby',         'Grumpy',        'Handsome',
  'Happy',         'Harebrained',    'Healthy',       'Helpful',
  'Helpless',      'High',           'Hollow',        'Homely',
  'Horrific',      'Huge',           'Hungry',        'Hurt',
  'Icy',           'Ideal',          'Immense',       'Impressionable',
  'Intrigued',     'Irate',          'Irritable',     'Itchy',
  'Jealous',       'Jittery',        'Jolly',         'Joyous',
  'Juicy',         'Jumpy',          'Kind',          'Lackadaisical',
  'Large',         'Lazy',           'Lethal',        'Little',
  'Lively',        'Livid',          'Lonely',        'Loose',
  'Lovely',        'Lucent',         'Lucky',         'Ludicrous',
  'Macho',         'Magnificent',    'Mammoth',       'Maniacal',
  'Massive',       'Melancholy',     'Melted',        'Miniature',
  'Minute',        'Mistaken',       'Misty',         'Moody',
  'Mortified',     'Motionless',     'Muddy',         'Mysterious',
  'Narrow',        'Nasty',          'Naughty',       'Nervous',
  'Nonchalant',    'Nonsensical',    'Nutritious',    'Nutty',
  'Obedient',      'Oblivious',      'Obnoxious',     'Odd',
  'Old Fashioned', 'Outrageous',     'Panicky',       'Perfect',
  'Perplexed',     'Petite',         'Petty',         'Plain',
  'Pleasant',      'Poised',         'Pompous',       'Precious',
  'Prickly',       'Proud',          'Pungent',       'Puny',
  'Quaint',        'Quizzical',      'Ratty',         'Reassured',
  'Relieved',      'Repulsive',      'Responsive',    'Ripe',
  'Robust',        'Rotten',         'Rotund',        'Rough',
  'Round',         'Salty',          'Sarcastic',     'Scant',
  'Scary',         'Scattered',      'Scrawny',       'Selfish',
  'Shaggy',        'Shaky',          'Shallow',       'Sharp',
  'Shiny',         'Short',          'Silky',         'Silly',
  'Skinny',        'Slimy',          'Slippery',      'Small',
  'Smarmy',        'Smiling',        'Smoggy',        'Smooth',
  'Smug',          'Soggy',          'Solid',         'Sore',
  'Sour',          'Sparkling',      'Spicy',         'Splendid',
  'Spotless',      'Square',         'Stale',         'Steady',
  'Steep',         'Responsive',     'Sticky',        'Stormy',
  'Stout',         'Straight',       'Strange',       'Strong',
  'Stunning',      'Substantial',    'Successful',    'Succulent',
  'Superficial',   'Superior',       'Swanky',        'Sweet',
  'Tart',          'Tasty',          'Teeny',         'Tender',
  'Tense',         'Terrible',       'Testy',         'Thankful',
  'Thick',         'Thoughtful',     'Thoughtless',   'Tight',
  'Timely',        'Tricky',         'Trite',         'Troubled',
  'Twittering',    'Uneven',         'Unsightly',     'Upset',
  'Uptight',       'Vast',           'Vexed',         'Victorious',
  'Virtuous',      'Vivacious',      'Vivid',         'Wacky',
  'Weary',         'Whimsical',      'Whopping',      'Wicked',
  'Witty',         'Wobbly',         'Wonderful',     'Worried',
  'Yummy',         'Zany',           'Zealous',       'Zippy'
];

const kColors = [
  'Alizarin',      'Amaranth',       'Amber',         'Amethyst',
  'Apricot',       'Aqua',           'Aquamarine',    'Asparagus',
  'Auburn',        'Azure',          'Beige',         'Bistre',
  'Black',         'Blue',           'Blue Green',    'Blue Violet',
  'Bondi Blue',    'Brass',          'Bronze',        'Brown',
  'Buff',          'Burgundy',       'Burnt Orange',  'Burnt Sienna',
  'Burnt Umber',   'Caput Mortuum',  'Cardinal',      'Carmine',
  'Carrot Orange', 'Celadon',        'Cerise',        'Cerulean',
  'Champagne',     'Charcoal',       'Chartreuse',    'Chestnut',
  'Chocolate',     'Cinnabar',       'Cinnamon',      'Cobalt',
  'Copper',        'Coral',          'Corn',          'Cornflower',
  'Cream',         'Crimson',        'Cyan',          'Dandelion',
  'Denim',         'Ecru',           'Emerald',       'Eggplant',
  'Falu Red',      'Fern Green',     'Firebrick',     'Flax',
  'Forest Green',  'French Rose',    'Fuchsia',       'Gamboge',
  'Gold',          'Goldenrod',      'Green',         'Grey',
  'Han Purple',    'Harlequin',      'Heliotrope',    'Indigo',
  'Ivory',         'Jade',           'Kelly Green',   'Khaki',
  'Lavender',      'Lawn Green',     'Lemon',         'Lemon Chiffon',
  'Lilac',         'Lime',           'Lime Green',    'Linen',
  'Magenta',       'Magnolia',       'Malachite',     'Maroon',
  'Mauve',         'Midnight Blue',  'Mint Green',    'Misty Rose',
  'Moss Green',    'Mustard',        'Myrtle',        'Navajo White',
  'Navy Blue',     'Ochre',          'Office Green',  'Olive',
  'Olivine',       'Orange',         'Orchid',        'Papaya Whip',
  'Peach',         'Pear',           'Periwinkle',    'Persimmon',
  'Pine Green',    'Pink',           'Platinum',      'Plum',
  'Powder Blue',   'Puce',           'Prussian Blue', 'Pumpkin',
  'Purple',        'Quartz Grey',    'Raw Umber',     'Razzmatazz',
  'Red',           'Robin Egg Blue', 'Rose',          'Royal Blue',
  'Royal Purple',  'Ruby',           'Russet',        'Rust',
  'Safety Orange', 'Saffron',        'Salmon',        'Sandy Brown',
  'Sangria',       'Sapphire',       'Scarlet',       'Sea Green',
  'Seashell',      'Sepia',          'Shocking Pink', 'Silver',
  'Sky Blue',      'Slate Grey',     'Smalt',         'Spring Bud',
  'Spring Green',  'Steel Blue',     'Tan',           'Tangerine',
  'Taupe',         'Teal',           'Tawny',         'Terra Cotta',
  'Thistle',       'Tomato',         'Turquoise',     'Tyrian Purple',
  'Ultramarine',   'Van Dyke Brown', 'Vermilion',     'Violet',
  'Viridian',      'Wheat',          'White',         'Wisteria',
  'Xanthic',       'Yellow',         'Zucchini'
];

const kAnimals = [
  'Aardvark',      'Albatross',     'Alligator',   'Alpaca',      'Ant',
  'Anteater',      'Antelope',      'Ape',         'Armadillo',   'Baboon',
  'Badger',        'Barracuda',     'Bat',         'Bear',        'Beaver',
  'Bee',           'Bird',          'Bison',       'Boar',        'Buffalo',
  'Butterfly',     'Camel',         'Caribou',     'Cassowary',   'Cat',
  'Caterpillar',   'Cattle',        'Chamois',     'Cheetah',     'Chicken',
  'Chimpanzee',    'Chinchilla',    'Chough',      'Coati',       'Cobra',
  'Cockroach',     'Cod',           'Cormorant',   'Coyote',      'Crab',
  'Crane',         'Crocodile',     'Crow',        'Curlew',      'Deer',
  'Dinosaur',      'Dog',           'Dogfish',     'Dolphin',     'Donkey',
  'Dotterel',      'Dove',          'Dragonfly',   'Duck',        'Dugong',
  'Dunlin',        'Eagle',         'Echidna',     'Eel',         'Eland',
  'Elephant',      'Elephant Seal', 'Elk',         'Emu',         'Falcon',
  'Ferret',        'Finch',         'Fish',        'Flamingo',    'Fly',
  'Fox',           'Frog',          'Gaur',        'Gazelle',     'Gerbil',
  'Giant Panda',   'Giraffe',       'Gnat',        'Gnu',         'Goat',
  'Goldfinch',     'Goosander',     'Goose',       'Gorilla',     'Goshawk',
  'Grasshopper',   'Grouse',        'Guanaco',     'Guinea Fowl', 'Guinea Pig',
  'Gull',          'Hamster',       'Hare',        'Hawk',        'Hedgehog',
  'Heron',         'Herring',       'Hippo',       'Hornet',      'Horse',
  'Hummingbird',   'Hyena',         'Ibex',        'Ibis',        'Jackal',
  'Jaguar',        'Jay',           'Jellyfish',   'Kangaroo',    'Kinkajou',
  'Koala',         'Komodo Dragon', 'Kouprey',     'Kudu',        'Lapwing',
  'Lark',          'Lemur',         'Leopard',     'Lion',        'Llama',
  'Lobster',       'Locust',        'Loris',       'Louse',       'Lyrebird',
  'Magpie',        'Mallard',       'Mammoth',     'Manatee',     'Mandrill',
  'Mink',          'Mole',          'Mongoose',    'Monkey',      'Moose',
  'Mouse',         'Mosquito',      'Narwhal',     'Newt',        'Nightingale',
  'Octopus',       'Okapi',         'Opossum',     'Ostrich',     'Otter',
  'Owl',           'Oyster',        'Panther',     'Parrot',      'Panda',
  'Partridge',     'Peafowl',       'Pelican',     'Penguin',     'Pheasant',
  'Pig',           'Pigeon',        'Polar Bear',  'Pony',        'Porcupine',
  'Porpoise',      'Prairie Dog',   'Quail',       'Quelea',      'Quetzal',
  'Rabbit',        'Raccoon',       'Ram',         'Rat',         'Raven',
  'Reindeer',      'Rhinoceros',    'Rook',        'Salamander',  'Salmon',
  'Sand Dollar',   'Sandpiper',     'Sardine',     'Sea Lion',    'Seahorse',
  'Seal',          'Shark',         'Sheep',       'Shrew',       'Skunk',
  'Sloth',         'Snail',         'Snake',       'Spider',      'Squid',
  'Squirrel',      'Starling',      'Stegosaurus', 'Swan',        'Tapir',
  'Tarsier',       'Termite',       'Tiger',       'Toad',        'Turkey',
  'Turtle',        'Vicuna',        'Wallaby',     'Walrus',      'Wasp',
  'Water Buffalo', 'Weasel',        'Whale',       'Wolf',        'Wolverine',
  'Wombat',        'Wren',          'Yak',         'Zebra'
];

function buildDrumWeights(firstNote, volumes) {
  const offset = noteTypeToProto(firstNote);
  const m = new Map();
  for (let i = 0; i < volumes.length; ++i) m.set(i + offset, volumes[i]);
  return m;
}

const kDw0 = buildDrumWeights('D#2', [
  0.5,    0.8333, 0.6667, 0.5882, 0.5882, 0.5,    0.5,    0.7692, 0.5,
  0.5,    0.625,  0.625,  0.8333, 0.7143, 0.5556, 0.5556, 0.5,    0.5,
  0.5882, 1,      0.625,  0.7143, 1,      0.5,    0.5882, 1,      0.7143,
  0.6667, 0.7143, 0.6667, 0.8333, 0.6667, 0.625,  0.5,    0.5263, 0.5,
  0.5,    0.5,    0.6667, 0.6667, 0.625,  0.625,  0.6667, 0.5882, 0.7692,
  0.8333, 0.625,  0.625,  0.5882, 0.5,    0.5,    0.5,    0.5,    0.5714,
  0.7692, 0.6667, 0.6667, 0.5,    0.5,    0.5882, 0.6667
]);

const kDw1 = buildDrumWeights('D#2', [
  0.8,    0.625,  1,      1,      0.9091, 0.4,    0.5,    0.8,    0.9091,
  0.9091, 0.6897, 1,      1.5385, 1,      0.7692, 0.4545, 0.7143, 0.9091,
  1.1111, 1.3333, 1,      0.9524, 1,      0.7692, 0.6667, 1.0526, 0.6667,
  0.6667, 0.8,    0.9524, 1.4286, 1.4286, 0.9524, 0.625,  0.5263, 0.625,
  0.5,    0.5882, 0.7407, 0.8,    0.7407, 0.7692, 0.8696, 0.7692, 1.2,
  1.25,   0.8333, 1.25,   1,      0.5,    0.5,    0.6897, 0.6667, 1,
  1.25,   1.25,   1.3333, 1.3333, 0.7143, 0.6667, 0.625
]);

const kDw2 = buildDrumWeights('D#2', [
  1, 1, 1.5385, 2.8571, 4, 2.5, 2, 1.6667, 2.8571, 4, 2.2222, 1.6667, 1.6667,
  1.4286, 1.4286, 3.5714, 4, 2
]);

const kDw3 = buildDrumWeights('G2', [1.25, 1, 0.8333, 1.8182, 1.8182, 2.5]);

const kDw4 = buildDrumWeights('G2', [
  1.6667, 2.5,    2.5,    4,      3.6364, 2.2222, 1.5385,
  1.1111, 1.6667, 1.3333, 2.5,    0.9091, 1.4286, 2.2222,
  2.5,    1.5385, 1.25,   2.8571, 2,      2.5,    2.5,
  2.5,    2.5,    0.25,   2.5,    2.5,    3.3333, 1.6667
]);

const kDw5 = buildDrumWeights('D#2', [
  1.8182, 1.8182, 1.8182, 2,      2,      1.5385, 0.7692,
  0.9091, 0.7407, 0.8333, 0.8696, 1.1111, 1.25,   1.6667,
  0.8696, 1.25,   1.5385, 1.5385, 1.6667, 0.9524
]);

const kVolWeights = [
  1,     0.7692, kDw0,   1.25,   1.25,   1,      0.9091, 1.25,   1,
  1,     1.25,   1,      0.5882, 0.7143, 1.4286, 1.1111, 0.7692, 1.25,
  0.625, 1,      0.8333, 0.9091, 1.1765, 0.6667, 1,      1,      0.8696,
  1,     0.625,  1.1111, 1.1111, kDw1,   0.9091, 1.25,   1.1765, 1.3333,
  kDw2,  1.25,   1.1111, kDw3,   kDw4,   0.9524, kDw5,
];

function getVolWeight(inst, index) {
  const a = kVolWeights[inst];
  return (a instanceof Map ? a.get(index) : a) || 1;
}

const kMSInstVol = 1;
const kMSPan = 2;
const kMSEqH = 3;
const kMSEqM = 4;
const kMSEqL = 5;
const kMSVol = 8;
const kMSDetune = 11;

function eq(high, mid, low) {
  return {high: high, mid: mid, low: low};
}

const kEqNormal = eq(0, 0, 0);
const kFadedEqSettings = [eq(10, 0, -48), eq(-48, 20, -48), eq(-48, 0, 20)];

function drum(inst, type) {
  return {inst: inst, type: type};
}

const kDrumKicks = [
  drum(2, 'B2'), drum(2, 'C3'), drum(31, 'B2'), drum(31, 'C3'), drum(39, 'G2'),
  drum(40, 'G2'), drum(40, 'G#2'), drum(36, 'D#2'), drum(36, 'E2'),
  drum(36, 'F2'), drum(42, 'D#2'), drum(42, 'E2'), drum(42, 'F2')
];

const kDrumSnares = [
  drum(2, 'G2'),   drum(2, 'D3'),   drum(2, 'C#3'),  drum(2, 'D#3'),
  drum(2, 'E3'),   drum(31, 'G2'),  drum(31, 'C#3'), drum(31, 'D3'),
  drum(31, 'D#3'), drum(31, 'E3'),  drum(39, 'A#2'), drum(39, 'B2'),
  drum(39, 'C3'),  drum(39, 'G#2'), drum(40, 'A2'),  drum(40, 'A#2'),
  drum(40, 'B2'),  drum(40, 'C3'),  drum(40, 'G#4'), drum(40, 'A#4'),
  drum(36, 'F#2'), drum(36, 'G2'),  drum(36, 'G#2'), drum(36, 'A2'),
  drum(36, 'A#2'), drum(36, 'G#3'), drum(42, 'F#2'), drum(42, 'G2'),
  drum(42, 'G#2'), drum(42, 'D#3'), drum(42, 'E3')
];

const kDrumHats = [
  drum(2, 'F#3'),  drum(2, 'G#3'),  drum(2, 'A#3'),  drum(2, 'D#4'),
  drum(2, 'F4'),   drum(2, 'B4'),   drum(31, 'F#3'), drum(31, 'G#3'),
  drum(31, 'A#3'), drum(31, 'D#4'), drum(31, 'F4'),  drum(31, 'B4'),
  drum(39, 'A2'),  drum(40, 'D3'),  drum(40, 'E3'),  drum(40, 'F#3'),
  drum(40, 'B3'),  drum(40, 'C#4'), drum(40, 'F#4'), drum(40, 'G4'),
  drum(36, 'B2'),  drum(36, 'C3'),  drum(42, 'F3'),  drum(42, 'F#3'),
  drum(42, 'G3'),  drum(42, 'G#3'), drum(42, 'A#3')
];

const kDrumCymbals = [
  drum(2, 'C#4'), drum(2, 'E4'), drum(2, 'G4'), drum(2, 'A4'), drum(31, 'C#4'),
  drum(31, 'E4'), drum(31, 'G4'), drum(31, 'A4'), drum(40, 'A4'),
  drum(40, 'F4'), drum(40, 'D#4'), drum(40, 'C4'), drum(40, 'A3'),
  drum(42, 'A3')
];

const kDrumAll = function() {
  const ranges = [
    [2, 3, 63], [31, 3, 63], [39, 7, 12], [40, 7, 34], [36, 3, 20], [42, 3, 22]
  ];
  const n = [];
  for (const [inst, lo, hi] of ranges) {
    for (let i = lo; i <= hi; ++i) n.push(drum(inst, noteType(i, 2)));
  }
  return n;
}();

function chordInst(inst, susLen) {
  return {inst: inst, susLen: susLen};
}
const kChordsInst = [
  chordInst(0, 1),    chordInst(1, 1),  chordInst(3, 1),  chordInst(4, 2),
  chordInst(6, 1),    chordInst(7, 1),  chordInst(8, 1),  chordInst(11, 0.5),
  chordInst(12, 0.5), chordInst(13, 4), chordInst(16, 4), chordInst(18, 1),
  chordInst(20, 1),   chordInst(23, 2), chordInst(24, 1), chordInst(25, 1),
  chordInst(26, 1),   chordInst(30, 1), chordInst(32, 1), chordInst(34, 1),
  chordInst(35, 1),   chordInst(38, 1), chordInst(41, 2)
];

function bassInst(inst) {
  return {inst: inst};
}
const kBassInst = [
  bassInst(21), bassInst(1), bassInst(5), bassInst(29), bassInst(32),
  bassInst(22), bassInst(3), bassInst(6), bassInst(13), bassInst(30),
  bassInst(14), bassInst(15), bassInst(16), bassInst(20), bassInst(24),
  bassInst(27)
];

function melodyInst(inst) {
  return {inst: inst};
}
const kMelodyInst = [
  melodyInst(0),  melodyInst(8),  melodyInst(17), melodyInst(25),
  melodyInst(26), melodyInst(19), melodyInst(34), melodyInst(21),
  melodyInst(1),  melodyInst(4),  melodyInst(32), melodyInst(22),
  melodyInst(33), melodyInst(6),  melodyInst(7),  melodyInst(13),
  melodyInst(14), melodyInst(15), melodyInst(16), melodyInst(11),
  melodyInst(18), melodyInst(20), melodyInst(23), melodyInst(41)
];

const kBar = 4;
const kSection = 8;

// Note: Melody generator assumes these scales are the same length.
const kMajorScale = [0, 2, 4, 5, 7, 9, 11];
const kMinorScale = [0, 2, 3, 5, 7, 8, 10];  // Natural minor.
const kScaleLen = kMajorScale.length;
