"""
Kundli matching: Ashtakoot guna milan out of 36, from the Moon of each partner.

Tables follow the common North Indian practice. Some kootas are asymmetric
(Varna, Gana): the first chart is read as the groom's, the second as the bride's.
"""

from __future__ import annotations

from services.astro.jyotish import SIGN_LORD
from services.astro.names import nakshatra_index, sign_index

# Varna by sign: 4 Brahmin (water), 3 Kshatriya (fire), 2 Vaishya (earth), 1 Shudra (air).
VARNA = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4]
VARNA_NAMES = {4: "Brahmin", 3: "Kshatriya", 2: "Vaishya", 1: "Shudra"}

VASHYA_GROUPS = ["Chatushpada", "Manava", "Jalachara", "Vanachara", "Keeta"]
VASHYA_POINTS = [  # rows and columns in VASHYA_GROUPS order
    [2, 1, 1, 0.5, 1],
    [1, 2, 0.5, 0, 1],
    [1, 0.5, 2, 1, 1],
    [0.5, 0, 1, 2, 0],
    [1, 1, 1, 0, 2],
]


def vashya_group(moon: float) -> str:
    s, d = sign_index(moon), moon % 30
    if s == 8:  # Sagittarius: human, then the horse's body
        return "Manava" if d < 15 else "Chatushpada"
    if s == 9:  # Capricorn: the goat, then the sea-creature tail
        return "Chatushpada" if d < 15 else "Jalachara"
    return ["Chatushpada", "Chatushpada", "Manava", "Jalachara", "Vanachara", "Manava",
            "Manava", "Keeta", None, None, "Manava", "Jalachara"][s]


YONI_ANIMALS = ["Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat",
                "Cow", "Buffalo", "Tiger", "Deer", "Monkey", "Mongoose", "Lion"]
# Yoni of each nakshatra, Ashwini to Revati.
NAKSHATRA_YONI = ["Horse", "Elephant", "Sheep", "Serpent", "Serpent", "Dog", "Cat", "Sheep", "Cat",
                  "Rat", "Rat", "Cow", "Buffalo", "Tiger", "Buffalo", "Tiger", "Deer", "Deer",
                  "Dog", "Monkey", "Mongoose", "Monkey", "Lion", "Horse", "Lion", "Cow", "Elephant"]
YONI_POINTS = [
    [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
    [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
    [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
    [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
    [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
    [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
    [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
    [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
    [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
    [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
    [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
    [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
    [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
    [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],
]

# Natural friendship of the grahas (Parashara).
FRIENDS = {
    "Sun": ({"Moon", "Mars", "Jupiter"}, {"Venus", "Saturn"}),
    "Moon": ({"Sun", "Mercury"}, set()),
    "Mars": ({"Sun", "Moon", "Jupiter"}, {"Mercury"}),
    "Mercury": ({"Sun", "Venus"}, {"Moon"}),
    "Jupiter": ({"Sun", "Moon", "Mars"}, {"Mercury", "Venus"}),
    "Venus": ({"Mercury", "Saturn"}, {"Sun", "Moon"}),
    "Saturn": ({"Mercury", "Venus"}, {"Sun", "Moon", "Mars"}),
}


def relation(a: str, b: str) -> str:
    if a == b:
        return "same"
    friends, enemies = FRIENDS[a]
    return "friend" if b in friends else "enemy" if b in enemies else "neutral"


def maitri_points(a: str, b: str) -> float:
    if a == b:
        return 5
    pair = sorted([relation(a, b), relation(b, a)])
    return {
        ("friend", "friend"): 5, ("friend", "neutral"): 4, ("neutral", "neutral"): 3,
        ("enemy", "friend"): 1, ("enemy", "neutral"): 0.5, ("enemy", "enemy"): 0,
    }[tuple(pair)]


GANAS = ["Deva", "Manushya", "Rakshasa"]
NAKSHATRA_GANA = ["Deva", "Manushya", "Rakshasa", "Manushya", "Deva", "Manushya", "Deva", "Deva", "Rakshasa",
                  "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Deva", "Rakshasa", "Deva", "Rakshasa",
                  "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva"]
GANA_POINTS = [  # groom's gana (rows) with bride's gana (columns)
    [6, 6, 1],
    [5, 6, 0],
    [1, 0, 6],
]

NADIS = ["Adi", "Madhya", "Antya"]
# Nadi runs Adi, Madhya, Antya, Antya, Madhya, Adi … in a zigzag through the nakshatras.
NAKSHATRA_NADI = [NADIS[[0, 1, 2, 2, 1, 0][i % 6]] for i in range(27)]

TARA_BAD = {3, 5, 7}  # Vipat, Pratyak, Naidhana


def _tara(from_nak: int, to_nak: int) -> int:
    return ((to_nak - from_nak) % 27) % 9 + 1


def match(groom_moon: float, bride_moon: float) -> dict:
    """Score each of the eight kootas from the two Moon longitudes (sidereal)."""
    gs, bs = sign_index(groom_moon), sign_index(bride_moon)
    gn, bn = nakshatra_index(groom_moon), nakshatra_index(bride_moon)

    varna = 1 if VARNA[gs] >= VARNA[bs] else 0
    gv, bv = vashya_group(groom_moon), vashya_group(bride_moon)
    vashya = VASHYA_POINTS[VASHYA_GROUPS.index(gv)][VASHYA_GROUPS.index(bv)]
    tara_g, tara_b = _tara(bn, gn), _tara(gn, bn)
    tara = 3 - 1.5 * ((tara_g in TARA_BAD) + (tara_b in TARA_BAD))
    gy, by = NAKSHATRA_YONI[gn], NAKSHATRA_YONI[bn]
    yoni = YONI_POINTS[YONI_ANIMALS.index(gy)][YONI_ANIMALS.index(by)]
    gl, bl = SIGN_LORD[gs], SIGN_LORD[bs]
    maitri = maitri_points(gl, bl)
    gg, bg = NAKSHATRA_GANA[gn], NAKSHATRA_GANA[bn]
    gana = GANA_POINTS[GANAS.index(gg)][GANAS.index(bg)]
    distance = sorted([(gs - bs) % 12 + 1, (bs - gs) % 12 + 1])
    bhakoot_dosha = tuple(distance) in {(2, 12), (5, 9), (6, 8)}
    bhakoot = 0 if bhakoot_dosha else 7
    gnadi, bnadi = NAKSHATRA_NADI[gn], NAKSHATRA_NADI[bn]
    nadi_dosha = gnadi == bnadi
    nadi = 0 if nadi_dosha else 8

    kootas = [
        {"koota": "Varna", "max": 1, "points": varna, "groom": VARNA_NAMES[VARNA[gs]], "bride": VARNA_NAMES[VARNA[bs]]},
        {"koota": "Vashya", "max": 2, "points": vashya, "groom": gv, "bride": bv},
        {"koota": "Tara", "max": 3, "points": tara, "groom": tara_g, "bride": tara_b},
        {"koota": "Yoni", "max": 4, "points": yoni, "groom": gy, "bride": by},
        {"koota": "Graha Maitri", "max": 5, "points": maitri, "groom": gl, "bride": bl},
        {"koota": "Gana", "max": 6, "points": gana, "groom": gg, "bride": bg},
        {"koota": "Bhakoot", "max": 7, "points": bhakoot, "groom": distance[0], "bride": distance[1]},
        {"koota": "Nadi", "max": 8, "points": nadi, "groom": gnadi, "bride": bnadi},
    ]
    # Bhakoot dosha is traditionally excused when both Moon signs share a lord or the lords are friends.
    bhakoot_cancelled = bhakoot_dosha and (gl == bl or maitri_points(gl, bl) >= 4)
    # Nadi dosha is excused when both share the Moon sign but not the nakshatra, or the nakshatra but not the sign.
    nadi_cancelled = nadi_dosha and ((gs == bs) != (gn == bn))
    return {
        "kootas": kootas,
        "total": sum(k["points"] for k in kootas),
        "max": 36,
        "doshas": {
            "bhakoot": {"present": bhakoot_dosha, "cancelled": bhakoot_cancelled},
            "nadi": {"present": nadi_dosha, "cancelled": nadi_cancelled},
        },
    }
