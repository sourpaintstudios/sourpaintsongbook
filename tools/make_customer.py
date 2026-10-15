#!/usr/bin/env python3
"""Build the blank customer Songbook from the personal index.html.
Usage: make_customer.py <src index.html> <dest index.html>"""
import json, re, sys
src, dest = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()

def sub1(old, new, count=1):
    global s
    assert s.count(old) == count, (old[:60], s.count(old))
    s = s.replace(old, new)

def song(id_, title, key, body):
    return {"id": id_, "v": 1, "title": title, "artist": "Traditional (public domain)",
            "key": key, "bpm": "", "category": None, "lyrics": body, "image": None}

SONGS = [
song("pd-amazing-grace", "Amazing Grace", "G",
"""Verse 1
[G]
Amazing grace, how sweet the sound
[C] [G]
That saved a wretch like me
[G] [Em]
I once was lost, but now am found
[D] [G]
Was blind, but now I see

Verse 2
[G]
'Twas grace that taught my heart to fear
[C] [G]
And grace my fears relieved
[G] [Em]
How precious did that grace appear
[D] [G]
The hour I first believed

Verse 3
[G]
Through many dangers, toils and snares
[C] [G]
I have already come
[G] [Em]
'Tis grace hath brought me safe thus far
[D] [G]
And grace will lead me home"""),
song("pd-clementine", "Oh My Darling, Clementine", "G",
"""Verse 1
[G]
In a cavern, in a canyon
[D7]
Excavating for a mine
[G]
Dwelt a miner, forty-niner
[D7] [G]
And his daughter, Clementine

Chorus
[G]
Oh my darling, oh my darling
[D7]
Oh my darling Clementine
[G]
You are lost and gone forever
[D7] [G]
Dreadful sorry, Clementine

Verse 2
[G]
Light she was and like a fairy
[D7]
And her shoes were number nine
[G]
Herring boxes without topses
[D7] [G]
Sandals were for Clementine

Chorus
[G]
Oh my darling, oh my darling
[D7]
Oh my darling Clementine
[G]
You are lost and gone forever
[D7] [G]
Dreadful sorry, Clementine

Verse 3
[G]
Drove she ducklings to the water
[D7]
Ev'ry morning just at nine
[G]
Hit her foot against a splinter
[D7] [G]
Fell into the foaming brine

Chorus
[G]
Oh my darling, oh my darling
[D7]
Oh my darling Clementine
[G]
You are lost and gone forever
[D7] [G]
Dreadful sorry, Clementine"""),
song("pd-swing-low", "Swing Low, Sweet Chariot", "G",
"""Chorus
[G] [C] [G]
Swing low, sweet chariot
[G] [D7]
Coming for to carry me home
[G] [C] [G]
Swing low, sweet chariot
[D7] [G]
Coming for to carry me home

Verse 1
[G]
I looked over Jordan, and what did I see
[C] [G]
Coming for to carry me home
[G]
A band of angels coming after me
[D7] [G]
Coming for to carry me home

Chorus
[G] [C] [G]
Swing low, sweet chariot
[G] [D7]
Coming for to carry me home
[G] [C] [G]
Swing low, sweet chariot
[D7] [G]
Coming for to carry me home

Verse 2
[G]
If you get there before I do
[C] [G]
Coming for to carry me home
[G]
Tell all my friends I'm coming too
[D7] [G]
Coming for to carry me home

Chorus
[G] [C] [G]
Swing low, sweet chariot
[G] [D7]
Coming for to carry me home
[G] [C] [G]
Swing low, sweet chariot
[D7] [G]
Coming for to carry me home"""),
song("pd-circle-unbroken", "Will the Circle Be Unbroken", "G",
"""Verse 1
[G]
There are loved ones in the glory
[C] [G]
Whose dear forms you often miss
[G]
When you close your earthly story
[D7] [G]
Will you join them in their bliss?

Chorus
[G]
Will the circle be unbroken
[C] [G]
By and by, by and by?
[G]
In a better home awaiting
[D7] [G]
In the sky, Lord, in the sky?

Verse 2
[G]
In the joyous days of childhood
[C] [G]
Oft they told of wondrous love
[G]
Pointed to the dying Saviour
[D7] [G]
Now they dwell with Him above

Chorus
[G]
Will the circle be unbroken
[C] [G]
By and by, by and by?
[G]
In a better home awaiting
[D7] [G]
In the sky, Lord, in the sky?

Verse 3
[G]
You remember songs of heaven
[C] [G]
Which you sang with childish voice
[G]
Do you love the hymns they taught you
[D7] [G]
Or are songs of earth your choice?

Chorus
[G]
Will the circle be unbroken
[C] [G]
By and by, by and by?
[G]
In a better home awaiting
[D7] [G]
In the sky, Lord, in the sky?"""),
song("pd-down-in-the-valley", "Down in the Valley", "G",
"""Verse 1
[G]
Down in the valley, the valley so low
[D7]
Hang your head over, hear the wind blow
[D7]
Hear the wind blow, dear, hear the wind blow
[G]
Hang your head over, hear the wind blow

Verse 2
[G]
Roses love sunshine, violets love dew
[D7]
Angels in heaven know I love you
[D7]
Know I love you, dear, know I love you
[G]
Angels in heaven know I love you

Verse 3
[G]
Writing this letter, containing three lines
[D7]
Answer my question, will you be mine?
[D7]
Will you be mine, dear, will you be mine
[G]
Answer my question, will you be mine?"""),
]

# 1. separate storage key
sub1("var STORE_KEY = 'spss_songbook_v1';", "var STORE_KEY = 'spss_songbook_customer_v1';")
# 2. no built-in categories
a = s.index("  var SONG_CATEGORIES = [")
b = s.index("];", a) + 2
s = s[:a] + "  var CUSTOMER_BUILD = true;\n  var SONG_CATEGORIES = [];" + s[b:]
# 3. seed songs
a = s.index("  var SEED_SONGS = [")
b = s.index("\n  ];\n  function applySeedSongs", a) + 5
js = json.dumps(SONGS, indent=4, ensure_ascii=False)
js = "\n".join(("  " + l if i else l) for i, l in enumerate(js.split("\n")))
s = s[:a] + "  var SEED_SONGS = " + js + ";" + s[b:]
# 4. blank starter cards on home
sub1("""body = '<div class="home-grid">' + tiles.map(function (t) {""",
"""body = '<div class="home-grid">' + starterCardsHtml() + tiles.map(function (t) {""")
sub1("  function renderHome() {",
"""  // Customer build: until the person makes their own first category, three
  // blank starter cards invite them to start a setlist and add songs.
  function starterCardsHtml() {
    if (arrangeMode || allCategories().length > 0) return '';
    function card(action, text) {
      return '<button type="button" class="home-tile home-tile-add" data-action="' + action + '">' +
        '<span class="home-tile-add-icon">' + plusSvg(28) + '</span>' +
        '<span class="home-tile-name">' + text + '</span></button>';
    }
    return card('new-category', 'Start your<br>setlist here') +
           card('new-song', 'Add your<br>song here') +
           card('new-song', 'Add your<br>song here');
  }
  function renderHome() {""")
s = re.sub(r"var APP_VERSION_LABEL = '[^']*';", "var APP_VERSION_LABEL = 'Songbook Starter 73';", s)
open(dest, 'w', encoding='utf-8').write(s)
print('ok', len(s))
