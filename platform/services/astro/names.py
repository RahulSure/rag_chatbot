"""English / Hindi names for signs, grahas and nakshatras, indexed the way jyotipy indexes them."""

from __future__ import annotations

SIGNS = [
    ("Aries", "मेष"), ("Taurus", "वृषभ"), ("Gemini", "मिथुन"), ("Cancer", "कर्क"),
    ("Leo", "सिंह"), ("Virgo", "कन्या"), ("Libra", "तुला"), ("Scorpio", "वृश्चिक"),
    ("Sagittarius", "धनु"), ("Capricorn", "मकर"), ("Aquarius", "कुंभ"), ("Pisces", "मीन"),
]

GRAHAS_HI = {
    "Sun": "सूर्य", "Moon": "चंद्र", "Mars": "मंगल", "Mercury": "बुध", "Jupiter": "गुरु",
    "Venus": "शुक्र", "Saturn": "शनि", "Rahu": "राहु", "Ketu": "केतु",
}

NAKSHATRAS_HI = [
    "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा", "पुनर्वसु", "पुष्य", "आश्लेषा",
    "मघा", "पूर्व फाल्गुनी", "उत्तर फाल्गुनी", "हस्त", "चित्रा", "स्वाति", "विशाखा", "अनुराधा",
    "ज्येष्ठा", "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा",
    "पूर्व भाद्रपद", "उत्तर भाद्रपद", "रेवती",
]

NAKSHATRA_SPAN = 360 / 27


def sign_index(longitude: float) -> int:
    return int(longitude % 360 // 30)


def nakshatra_index(longitude: float) -> int:
    return int(longitude % 360 // NAKSHATRA_SPAN)


def nakshatra_pada(longitude: float) -> int:
    return int((longitude % NAKSHATRA_SPAN) // (NAKSHATRA_SPAN / 4)) + 1
