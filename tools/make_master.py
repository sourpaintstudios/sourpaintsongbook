#!/usr/bin/env python3
"""Add the public-domain library (card + songs) to the personal/master Songbook.
Usage: make_master.py <src index.html> <dest index.html>
Reuses the song list built by make_customer.py (same songs/ folder)."""
import json, re, sys, os
here = os.path.dirname(os.path.abspath(__file__))
src, dest = sys.argv[1], sys.argv[2]
cust = open(os.path.join(here, 'make_customer.py'), encoding='utf-8').read()
cut = cust.index("# 1. separate storage key")
ns = {'__file__': os.path.join(here, 'make_customer.py')}
sys.argv = ['make_customer.py', src, '/dev/null']
exec(compile(cust[:cut], 'make_customer_head', 'exec'), ns)
SONGS = ns['SONGS']
s = open(src, encoding='utf-8').read()
def sub1(old, new):
    global s
    assert s.count(old) == 1, (old[:60], s.count(old))
    s = s.replace(old, new)
# category
sub1("    { id: 'covers',               label: 'Covers',               tabLabel: 'Covers' }\n  ];",
     "    { id: 'covers',               label: 'Covers',               tabLabel: 'Covers' },\n    { id: 'public-domain',        label: 'Public Domain Songs',  tabLabel: 'Public Domain' }\n  ];")
sub1("    'covers': { src: 'covers.jpg', focus: 'center 35%' }\n  };",
     "    'covers': { src: 'covers.jpg', focus: 'center 35%' },\n    'public-domain': { src: 'public-domain.jpg', focus: 'center 22%' }\n  };")
sub1("    'uncategorized': ['#8A8A80', '#1C1C19']\n  };",
     "    'uncategorized': ['#8A8A80', '#1C1C19'],\n    'public-domain': ['#93D83E', '#1C2A10']\n  };")
sub1("    'uncategorized': 'No category yet'\n  };",
     "    'uncategorized': 'No category yet',\n    'public-domain': 'Chords included'\n  };")
# seed songs: append to existing seed list
a = s.index("  var SEED_SONGS = [")
b = s.index("\n  ];\n  function applySeedSongs", a)
js = json.dumps(SONGS, indent=4, ensure_ascii=False)
inner = js[1:-1].strip('\n')
inner = "\n".join("  " + l for l in inner.split("\n"))
s = s[:b] + ",\n" + inner + s[b:]
# tile style for the art tile hides duplicate label (graphic carries the words)
sub1("</style>\n</head>", ".home-tile[data-filter=\"public-domain\"] .home-tile-name, .home-tile[data-filter=\"public-domain\"] .home-tile-sub { display: none; }\n.home-tile[data-filter=\"public-domain\"] .home-tile-label { background: none; }\n.home-tile[data-filter=\"public-domain\"] .home-tile-count { color: #1C1C19; text-shadow: none; }\n</style>\n</head>")
# how-to
sub1("      ['Category tiles', 'Tap a tile to open that group of songs.'],",
     "      ['Category tiles', 'Tap a tile to open that group of songs.'],\n      ['Public Domain Songs', 'The Public Domain Songs tile holds %d copyright-free songs with chords (hymns, folk, cowboy, spirituals, sea shanties, parlor songs, holiday carols). Chords and lyrics are for reference and may differ from other versions. Edit or delete any of them like your own songs.'],\n" % len(SONGS))
m = re.search(r"var APP_VERSION_LABEL = 'Version (\d+)';", s)
s = s.replace(m.group(0), "var APP_VERSION_LABEL = 'Version %d';" % (int(m.group(1)) + 1))
open(dest, 'w', encoding='utf-8').write(s)
print('ok', len(SONGS), 'songs; version', int(m.group(1)) + 1)
