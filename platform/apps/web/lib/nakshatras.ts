/**
 * The 27 nakshatras: ruling graha (Vimshottari), deity, symbol, gana, and our
 * own short reading and suggested practice. Index 0 is Ashwini.
 */

import type { Pair } from "./jyotish-text";

export interface Nakshatra {
  name: string;
  hi: string;
  lord: string;
  deity: Pair;
  symbol: Pair;
  gana: "Deva" | "Manushya" | "Rakshasa";
  traits: Pair;
  practice: Pair;
}

export const NAKSHATRAS: Nakshatra[] = [
  { name: "Ashwini", hi: "अश्विनी", lord: "Ketu", deity: ["The Ashwini Kumaras, divine healers", "अश्विनी कुमार, देवताओं के वैद्य"], symbol: ["A horse's head", "अश्व का मुख"], gana: "Deva",
    traits: ["Quick, fresh and healing. You like to begin, to help fast, and to move on.", "तीव्र, नवीन और उपचारक। आप आरम्भ करना, शीघ्र सहायता करना और आगे बढ़ना पसंद करते हैं।"],
    practice: ["Healing prayers and Ganesha worship at the start of any work.", "उपचार की प्रार्थना और हर कार्य के आरम्भ में गणेश पूजन।"] },
  { name: "Bharani", hi: "भरणी", lord: "Venus", deity: ["Yama, lord of dharma and death", "यम, धर्म और मृत्यु के स्वामी"], symbol: ["The womb", "गर्भ"], gana: "Manushya",
    traits: ["Strong, creative and able to carry heavy responsibility. Life's extremes teach you restraint.", "दृढ़, सृजनशील और भारी उत्तरदायित्व उठाने में सक्षम। जीवन की चरम स्थितियाँ संयम सिखाती हैं।"],
    practice: ["Lakshmi worship on Fridays and a disciplined daily routine.", "शुक्रवार को लक्ष्मी पूजन और अनुशासित दिनचर्या।"] },
  { name: "Krittika", hi: "कृत्तिका", lord: "Sun", deity: ["Agni, the sacred fire", "अग्नि देव"], symbol: ["A flame or a razor", "अग्निशिखा या उस्तरा"], gana: "Rakshasa",
    traits: ["Sharp, honest and purifying. You cut through falsehood and protect what is yours.", "तीक्ष्ण, सत्यनिष्ठ और शुद्ध करने वाले। आप असत्य को काटते हैं और अपनों की रक्षा करते हैं।"],
    practice: ["Surya arghya at sunrise and a daily lamp.", "सूर्योदय पर सूर्य को अर्घ्य और प्रतिदिन दीपक।"] },
  { name: "Rohini", hi: "रोहिणी", lord: "Moon", deity: ["Brahma (Prajapati), the creator", "ब्रह्मा (प्रजापति), सृष्टिकर्ता"], symbol: ["An ox cart", "बैलगाड़ी"], gana: "Manushya",
    traits: ["Beautiful, artistic and nurturing. You grow things and love comfort.", "सुंदर, कलात्मक और पोषण करने वाले। आप चीज़ों को बढ़ाते हैं और सुख से प्रेम करते हैं।"],
    practice: ["Monday Shiva worship and devotion to Sri Krishna.", "सोमवार को शिव पूजन और श्रीकृष्ण की भक्ति।"] },
  { name: "Mrigashira", hi: "मृगशिरा", lord: "Mars", deity: ["Soma, the Moon", "सोम, चंद्र देव"], symbol: ["A deer's head", "मृग का शीश"], gana: "Deva",
    traits: ["Searching, gentle and curious. You are always looking for the next truth.", "खोजी, कोमल और जिज्ञासु। आप सदा अगले सत्य की खोज में रहते हैं।"],
    practice: ["Hanuman worship on Tuesdays and steady japa to settle the restless mind.", "मंगलवार को हनुमान उपासना और चंचल मन को स्थिर करने के लिए नियमित जप।"] },
  { name: "Ardra", hi: "आर्द्रा", lord: "Rahu", deity: ["Rudra, the storm form of Shiva", "रुद्र, शिव का प्रचंड रूप"], symbol: ["A teardrop", "अश्रु बिंदु"], gana: "Manushya",
    traits: ["Intense and transforming. Storms in life clear the way for something new.", "गहन और रूपांतरकारी। जीवन के तूफ़ान कुछ नए के लिए मार्ग बनाते हैं।"],
    practice: ["Rudra abhishek and Shiva worship, especially on Mondays.", "रुद्राभिषेक और शिव उपासना, विशेषकर सोमवार को।"] },
  { name: "Punarvasu", hi: "पुनर्वसु", lord: "Jupiter", deity: ["Aditi, mother of the gods", "अदिति, देवताओं की माता"], symbol: ["A bow and quiver", "धनुष और तरकश"], gana: "Deva",
    traits: ["Hopeful and renewing. You return home, again and again, to what is good.", "आशावान और नवीकरण करने वाले। आप बार-बार शुभ की ओर लौटते हैं।"],
    practice: ["Sri Rama's name and guru mantra on Thursdays.", "गुरुवार को श्रीराम नाम और गुरु मंत्र।"] },
  { name: "Pushya", hi: "पुष्य", lord: "Saturn", deity: ["Brihaspati, guru of the gods", "बृहस्पति, देवगुरु"], symbol: ["A cow's udder, or a flower", "गाय का थन, या पुष्प"], gana: "Deva",
    traits: ["Nourishing, devoted and protective. The most auspicious nakshatra for beginnings.", "पोषक, भक्त और रक्षक। आरम्भ के लिए सबसे शुभ नक्षत्र।"],
    practice: ["Guru seva and beginning new sadhanas on Pushya days.", "गुरु सेवा और पुष्य नक्षत्र के दिन नई साधना का आरम्भ।"] },
  { name: "Ashlesha", hi: "आश्लेषा", lord: "Mercury", deity: ["The Nagas, serpent deities", "नाग देवता"], symbol: ["A coiled serpent", "कुंडली मारे सर्प"], gana: "Rakshasa",
    traits: ["Perceptive, mystical and strong-willed. Kundalini and hidden knowledge call you.", "अंतर्दृष्टि वाले, रहस्यमय और दृढ़ इच्छाशक्ति वाले। कुंडलिनी और गूढ़ ज्ञान आपको बुलाते हैं।"],
    practice: ["Naga worship on Panchami and Ganesha mantra.", "पंचमी को नाग पूजन और गणेश मंत्र।"] },
  { name: "Magha", hi: "मघा", lord: "Ketu", deity: ["The Pitris, the ancestors", "पितर"], symbol: ["A royal throne", "राजसिंहासन"], gana: "Rakshasa",
    traits: ["Dignified, traditional and proud of your lineage. The ancestors watch over you.", "प्रतिष्ठित, परम्परावादी और अपने कुल पर गर्व करने वाले। पितर आपकी रक्षा करते हैं।"],
    practice: ["Tarpan on Amavasya and respect for elders.", "अमावस्या पर तर्पण और बड़ों का सम्मान।"] },
  { name: "Purva Phalguni", hi: "पूर्व फाल्गुनी", lord: "Venus", deity: ["Bhaga, god of good fortune", "भग, सौभाग्य के देवता"], symbol: ["The front legs of a bed", "पलंग के अगले पाए"], gana: "Manushya",
    traits: ["Joyful, loving and creative. You know how to rest and how to celebrate.", "आनंदी, प्रेमी और सृजनशील। आप विश्राम और उत्सव दोनों जानते हैं।"],
    practice: ["Shiva-Parvati worship for harmony, and Lakshmi on Fridays.", "सामंजस्य के लिए शिव-पार्वती पूजन, और शुक्रवार को लक्ष्मी।"] },
  { name: "Uttara Phalguni", hi: "उत्तर फाल्गुनी", lord: "Sun", deity: ["Aryaman, god of friendship and contracts", "अर्यमा, मित्रता और वचन के देवता"], symbol: ["The back legs of a bed", "पलंग के पिछले पाए"], gana: "Manushya",
    traits: ["Reliable, generous and kind. You keep your word and help others prosper.", "विश्वसनीय, उदार और दयालु। आप वचन निभाते हैं और दूसरों को आगे बढ़ाते हैं।"],
    practice: ["Surya worship and keeping vows.", "सूर्य उपासना और संकल्पों का पालन।"] },
  { name: "Hasta", hi: "हस्त", lord: "Moon", deity: ["Savitr, the inspiring sun", "सविता, प्रेरक सूर्य"], symbol: ["An open hand", "खुला हाथ"], gana: "Deva",
    traits: ["Skilful, clever and practical. Your hands make things happen.", "कुशल, चतुर और व्यावहारिक। आपके हाथ काम को साकार करते हैं।"],
    practice: ["Gayatri and Savitr worship at sunrise.", "सूर्योदय पर गायत्री और सविता उपासना।"] },
  { name: "Chitra", hi: "चित्रा", lord: "Mars", deity: ["Vishvakarma, the divine architect", "विश्वकर्मा, दिव्य शिल्पी"], symbol: ["A bright jewel", "चमकता रत्न"], gana: "Rakshasa",
    traits: ["Brilliant, artistic and charismatic. You build beautiful things.", "तेजस्वी, कलात्मक और आकर्षक। आप सुंदर चीज़ें रचते हैं।"],
    practice: ["Durga worship and devotion through creative work.", "दुर्गा उपासना और सृजनात्मक कार्य के माध्यम से भक्ति।"] },
  { name: "Swati", hi: "स्वाति", lord: "Rahu", deity: ["Vayu, the wind", "वायु देव"], symbol: ["A young shoot swaying in the wind", "हवा में लहराता अंकुर"], gana: "Deva",
    traits: ["Independent, adaptable and fair. You bend with the wind and do not break.", "स्वतंत्र, लचीले और न्यायप्रिय। आप हवा के साथ झुकते हैं, टूटते नहीं।"],
    practice: ["Pranayama, Saraswati worship and Hanuman (son of Vayu).", "प्राणायाम, सरस्वती पूजन और हनुमान (पवनपुत्र) की उपासना।"] },
  { name: "Vishakha", hi: "विशाखा", lord: "Jupiter", deity: ["Indra and Agni together", "इंद्र और अग्नि"], symbol: ["A triumphal arch", "विजय तोरण"], gana: "Rakshasa",
    traits: ["Determined and goal-driven. You reach what you set out for.", "दृढ़ निश्चयी और लक्ष्य-केंद्रित। जो ठान लेते हैं, वहाँ पहुँचते हैं।"],
    practice: ["Guru worship on Thursdays and fire offerings (havan).", "गुरुवार को गुरु पूजन और हवन।"] },
  { name: "Anuradha", hi: "अनुराधा", lord: "Saturn", deity: ["Mitra, god of friendship", "मित्र, मैत्री के देवता"], symbol: ["A lotus", "कमल"], gana: "Deva",
    traits: ["Devoted, friendly and disciplined. You make friendships that last.", "भक्त, मैत्रीपूर्ण और अनुशासित। आप स्थायी मित्रता बनाते हैं।"],
    practice: ["Devotion to the guru and Shani worship on Saturdays.", "गुरु के प्रति भक्ति और शनिवार को शनि उपासना।"] },
  { name: "Jyeshtha", hi: "ज्येष्ठा", lord: "Mercury", deity: ["Indra, king of the gods", "इंद्र, देवराज"], symbol: ["A round amulet", "गोल रक्षा कवच"], gana: "Rakshasa",
    traits: ["Protective, responsible and senior in spirit. You carry others.", "रक्षक, उत्तरदायी और आत्मा से ज्येष्ठ। आप दूसरों का भार उठाते हैं।"],
    practice: ["Bhairava and Hanuman worship for protection.", "रक्षा के लिए भैरव और हनुमान उपासना।"] },
  { name: "Mula", hi: "मूल", lord: "Ketu", deity: ["Nirriti, goddess of dissolution", "निऋति, विलय की देवी"], symbol: ["A bunch of roots", "जड़ों का गुच्छा"], gana: "Rakshasa",
    traits: ["Deep and investigative. You go to the root of things, including yourself.", "गहन और अन्वेषी। आप हर चीज़ की जड़ तक जाते हैं, स्वयं की भी।"],
    practice: ["Kali or Chamunda worship and Ganesha mantra.", "काली या चामुंडा उपासना और गणेश मंत्र।"] },
  { name: "Purva Ashadha", hi: "पूर्वाषाढ़ा", lord: "Venus", deity: ["Apas, the sacred waters", "आपः, पवित्र जल"], symbol: ["An elephant tusk, or a fan", "हाथी दाँत, या पंखा"], gana: "Manushya",
    traits: ["Invincible in spirit and persuasive. You refresh and inspire others.", "अजेय भाव वाले और प्रभावशाली। आप दूसरों को तरोताज़ा और प्रेरित करते हैं।"],
    practice: ["Water offerings, Ganga snan, and Lakshmi worship.", "जल अर्पण, गंगा स्नान, और लक्ष्मी पूजन।"] },
  { name: "Uttara Ashadha", hi: "उत्तराषाढ़ा", lord: "Sun", deity: ["The Vishvedevas, universal gods", "विश्वेदेव"], symbol: ["An elephant tusk", "हाथी दाँत"], gana: "Manushya",
    traits: ["Righteous, steady and victorious in the end. Your victories last.", "धर्मनिष्ठ, स्थिर और अंततः विजयी। आपकी विजय स्थायी होती है।"],
    practice: ["Surya and Ganesha worship, and keeping to dharma.", "सूर्य और गणेश उपासना, और धर्म का पालन।"] },
  { name: "Shravana", hi: "श्रवण", lord: "Moon", deity: ["Vishnu", "विष्णु"], symbol: ["An ear, or three footprints", "कान, या तीन पदचिह्न"], gana: "Deva",
    traits: ["A listener and a learner. Knowledge reaches you through hearing.", "श्रोता और जिज्ञासु। ज्ञान आप तक सुनने से पहुँचता है।"],
    practice: ["Vishnu sahasranama and listening to the guru's words.", "विष्णु सहस्रनाम और गुरु वचनों का श्रवण।"] },
  { name: "Dhanishta", hi: "धनिष्ठा", lord: "Mars", deity: ["The eight Vasus", "अष्ट वसु"], symbol: ["A drum", "मृदंग"], gana: "Rakshasa",
    traits: ["Rhythmic, generous and prosperous. Music and wealth come to you.", "लयबद्ध, उदार और समृद्ध। संगीत और धन आपके पास आते हैं।"],
    practice: ["Kirtan, Shiva worship, and Hanuman on Tuesdays.", "कीर्तन, शिव उपासना, और मंगलवार को हनुमान।"] },
  { name: "Shatabhisha", hi: "शतभिषा", lord: "Rahu", deity: ["Varuna, lord of the waters", "वरुण, जल के स्वामी"], symbol: ["An empty circle", "रिक्त वृत्त"], gana: "Rakshasa",
    traits: ["Private, healing and philosophical. A hundred healers live in you.", "एकांतप्रिय, उपचारक और दार्शनिक। आपमें सौ वैद्य बसते हैं।"],
    practice: ["Durga worship and healing practices.", "दुर्गा उपासना और उपचार साधना।"] },
  { name: "Purva Bhadrapada", hi: "पूर्व भाद्रपद", lord: "Jupiter", deity: ["Aja Ekapada, the one-footed form of Shiva", "अज एकपाद, शिव का एक रूप"], symbol: ["Two front legs of a funeral cot", "शय्या के दो अगले पाए"], gana: "Manushya",
    traits: ["Intense, idealistic and spiritual. You burn away what is false.", "गहन, आदर्शवादी और आध्यात्मिक। आप असत्य को जला देते हैं।"],
    practice: ["Shiva worship and austerity (tapas).", "शिव उपासना और तप।"] },
  { name: "Uttara Bhadrapada", hi: "उत्तर भाद्रपद", lord: "Saturn", deity: ["Ahir Budhnya, the serpent of the deep", "अहिर्बुध्न्य, गहराई के नाग"], symbol: ["Two back legs of a funeral cot", "शय्या के दो पिछले पाए"], gana: "Manushya",
    traits: ["Calm, wise and self-controlled. Deep waters run still in you.", "शांत, विवेकी और आत्मसंयमी। आपमें गहरा जल शांत बहता है।"],
    practice: ["Meditation, Shani worship and service.", "ध्यान, शनि उपासना और सेवा।"] },
  { name: "Revati", hi: "रेवती", lord: "Mercury", deity: ["Pushan, protector of travellers", "पूषा, यात्रियों के रक्षक"], symbol: ["A fish, or a drum", "मछली, या मृदंग"], gana: "Deva",
    traits: ["Kind, gentle and protective of all creatures. The journey's end, and a new beginning.", "दयालु, कोमल और सब प्राणियों के रक्षक। यात्रा का अंत, और नया आरम्भ।"],
    practice: ["Vishnu worship and feeding animals.", "विष्णु उपासना और पशुओं को भोजन।"] },
];

export const GANA_HI: Record<string, string> = { Deva: "देव", Manushya: "मनुष्य", Rakshasa: "राक्षस" };
