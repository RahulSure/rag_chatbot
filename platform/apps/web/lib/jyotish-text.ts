/**
 * Words for the chart tools, in English and Hindi: what each divisional chart
 * shows, the Jaimini karakas, the deity each graha points to, the eight kootas,
 * the nine taras, muntha houses and the Western signs. Our own short readings.
 */

import type { Lang } from "./i18n";

export type Pair = [string, string];
export const say = (pair: Pair, lang: Lang) => (lang === "hi" ? pair[1] : pair[0]);

export const GRAHA_HI: Record<string, string> = {
  Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु",
  Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु",
};
export const SIGN_HI: Record<string, string> = {
  Aries: "मेष", Taurus: "वृषभ", Gemini: "मिथुन", Cancer: "कर्क", Leo: "सिंह", Virgo: "कन्या",
  Libra: "तुला", Scorpio: "वृश्चिक", Sagittarius: "धनु", Capricorn: "मकर", Aquarius: "कुंभ", Pisces: "मीन",
};
export const graha = (name: string, lang: Lang) => (lang === "hi" ? GRAHA_HI[name] ?? name : name);
export const sign = (name: string, lang: Lang) => (lang === "hi" ? SIGN_HI[name] ?? name : name);

export const VARGAS: { id: string; name: Pair; about: Pair }[] = [
  { id: "D1", name: ["Rashi", "राशि"], about: ["The birth chart itself: body, temperament and the whole life.", "जन्म कुंडली स्वयं: शरीर, स्वभाव और सम्पूर्ण जीवन।"] },
  { id: "D2", name: ["Hora", "होरा"], about: ["Wealth and how it is gathered and kept.", "धन, और वह कैसे अर्जित तथा संचित होता है।"] },
  { id: "D3", name: ["Drekkana", "द्रेष्काण"], about: ["Siblings, courage and one's own effort.", "भाई-बहन, साहस और अपना पुरुषार्थ।"] },
  { id: "D4", name: ["Chaturthamsha", "चतुर्थांश"], about: ["Home, land, property and inner contentment.", "घर, भूमि, संपत्ति और आंतरिक संतोष।"] },
  { id: "D7", name: ["Saptamsha", "सप्तांश"], about: ["Children and creative continuity.", "संतान और सृजन की निरंतरता।"] },
  { id: "D9", name: ["Navamsha", "नवांश"], about: ["Marriage, dharma and the strength of every planet. The most important chart after the birth chart.", "विवाह, धर्म और हर ग्रह का बल। जन्म कुंडली के बाद सबसे महत्वपूर्ण चार्ट।"] },
  { id: "D10", name: ["Dashamsha", "दशमांश"], about: ["Career, work in the world and status.", "करियर, संसार में कर्म और प्रतिष्ठा।"] },
  { id: "D12", name: ["Dwadashamsha", "द्वादशांश"], about: ["Parents and what is inherited from them.", "माता-पिता और उनसे मिली विरासत।"] },
  { id: "D16", name: ["Shodashamsha", "षोडशांश"], about: ["Vehicles, comforts and happiness.", "वाहन, सुख-सुविधा और प्रसन्नता।"] },
  { id: "D20", name: ["Vimshamsha", "विंशांश"], about: ["Upasana: spiritual practice, devotion and progress in sadhana.", "उपासना: आध्यात्मिक साधना, भक्ति और साधना में प्रगति।"] },
  { id: "D24", name: ["Chaturvimshamsha", "चतुर्विंशांश"], about: ["Learning, education and knowledge.", "विद्या, शिक्षा और ज्ञान।"] },
  { id: "D27", name: ["Bhamsha", "भांश"], about: ["Inner strengths and weaknesses.", "भीतरी बल और दुर्बलताएँ।"] },
  { id: "D30", name: ["Trimshamsha", "त्रिंशांश"], about: ["Difficulties and the lessons they bring.", "कठिनाइयाँ और उनसे मिलने वाली सीख।"] },
  { id: "D40", name: ["Khavedamsha", "खवेदांश"], about: ["What comes through the mother's line.", "मातृ पक्ष से आने वाले शुभ-अशुभ फल।"] },
  { id: "D45", name: ["Akshavedamsha", "अक्षवेदांश"], about: ["Character and what comes through the father's line.", "चरित्र और पितृ पक्ष से आने वाले फल।"] },
  { id: "D60", name: ["Shashtiamsha", "षष्ट्यंश"], about: ["Past karma: the finest division, needing an exact birth time.", "पूर्व कर्म: सबसे सूक्ष्म विभाग, जिसके लिए सटीक जन्म समय आवश्यक है।"] },
];

export const KARAKAS: Record<string, { name: Pair; about: Pair }> = {
  Atmakaraka: { name: ["Atmakaraka", "आत्मकारक"], about: ["The soul's planet: the lesson your soul came to learn.", "आत्मा का ग्रह: वह सीख जो आत्मा सीखने आई है।"] },
  Amatyakaraka: { name: ["Amatyakaraka", "अमात्यकारक"], about: ["Career and the work that serves your soul.", "करियर और वह कर्म जो आत्मा की सेवा करता है।"] },
  Bhratrikaraka: { name: ["Bhratrikaraka", "भ्रातृकारक"], about: ["Siblings, courage, and the guru.", "भाई-बहन, साहस, और गुरु।"] },
  Matrikaraka: { name: ["Matrikaraka", "मातृकारक"], about: ["Mother, home and the heart's peace.", "माता, घर और हृदय की शांति।"] },
  Putrakaraka: { name: ["Putrakaraka", "पुत्रकारक"], about: ["Children, creativity and mantra siddhi.", "संतान, सृजन और मंत्र सिद्धि।"] },
  Gnatikaraka: { name: ["Gnatikaraka", "ज्ञातिकारक"], about: ["Obstacles, rivals and illness: what tests you.", "बाधाएँ, प्रतिद्वंद्वी और रोग: जो आपकी परीक्षा लेते हैं।"] },
  Darakaraka: { name: ["Darakaraka", "दारकारक"], about: ["The spouse and close partnerships.", "जीवनसाथी और निकट साझेदारियाँ।"] },
};

// Jaimini's deities for the planet in (or ruling) the 12th from the karakamsha.
export const DEITY: Record<string, { deity: Pair; also: Pair }> = {
  Sun: { deity: ["Shiva", "शिव"], also: ["also Sri Rama", "श्रीराम भी"] },
  Moon: { deity: ["Gauri (Parvati)", "गौरी (पार्वती)"], also: ["also Sri Krishna", "श्रीकृष्ण भी"] },
  Mars: { deity: ["Skanda (Kartikeya)", "स्कंद (कार्तिकेय)"], also: ["also Hanuman", "हनुमान भी"] },
  Mercury: { deity: ["Vishnu", "विष्णु"], also: ["also Ganesha", "गणेश भी"] },
  Jupiter: { deity: ["Sambasiva (Shiva with Parvati)", "साम्बशिव (पार्वती सहित शिव)"], also: ["also Dattatreya", "दत्तात्रेय भी"] },
  Venus: { deity: ["Lakshmi", "लक्ष्मी"], also: ["also Gauri", "गौरी भी"] },
  Saturn: { deity: ["Shani", "शनि देव"], also: ["also Hanuman and Bhairava", "हनुमान और भैरव भी"] },
  Rahu: { deity: ["Durga", "दुर्गा"], also: ["also the serpent deities", "नाग देवता भी"] },
  Ketu: { deity: ["Ganesha", "गणेश"], also: ["also Chamunda", "चामुंडा भी"] },
};

export const KOOTAS: Record<string, { name: Pair; about: Pair }> = {
  Varna: { name: ["Varna", "वर्ण"], about: ["Spiritual temperament and ego.", "आध्यात्मिक स्वभाव और अहं।"] },
  Vashya: { name: ["Vashya", "वश्य"], about: ["Mutual attraction and influence.", "परस्पर आकर्षण और प्रभाव।"] },
  Tara: { name: ["Tara", "तारा"], about: ["Destiny and well-being together.", "साथ में भाग्य और कल्याण।"] },
  Yoni: { name: ["Yoni", "योनि"], about: ["Physical and instinctive compatibility.", "शारीरिक और स्वाभाविक अनुकूलता।"] },
  "Graha Maitri": { name: ["Graha Maitri", "ग्रह मैत्री"], about: ["Friendship of minds: the Moon signs' lords.", "मन की मित्रता: चंद्र राशियों के स्वामी।"] },
  Gana: { name: ["Gana", "गण"], about: ["Nature: divine, human or fierce.", "स्वभाव: देव, मनुष्य या राक्षस।"] },
  Bhakoot: { name: ["Bhakoot", "भकूट"], about: ["Family welfare and prosperity.", "परिवार का कल्याण और समृद्धि।"] },
  Nadi: { name: ["Nadi", "नाड़ी"], about: ["Health and children: the most weighty koota.", "स्वास्थ्य और संतान: सबसे महत्वपूर्ण कूट।"] },
};

export const TARAS: Record<string, { name: Pair; about: Pair }> = {
  Janma: { name: ["Janma", "जन्म"], about: ["Your own star: a day to go gently and look after yourself.", "आपका अपना तारा: सहजता से चलें और अपना ध्यान रखें।"] },
  Sampat: { name: ["Sampat", "सम्पत्"], about: ["Wealth: good for gains, purchases and steady work.", "सम्पत्ति: लाभ, खरीद और स्थिर काम के लिए शुभ।"] },
  Vipat: { name: ["Vipat", "विपत्"], about: ["Obstacles: avoid big beginnings; keep to routine.", "विपत्ति: बड़े आरम्भ से बचें; दिनचर्या बनाए रखें।"] },
  Kshema: { name: ["Kshema", "क्षेम"], about: ["Well-being: comfort, healing and care.", "क्षेम: सुख, उपचार और देखभाल।"] },
  Pratyak: { name: ["Pratyak", "प्रत्यक्"], about: ["Resistance: expect delays; be patient.", "प्रतिरोध: देरी की संभावना; धैर्य रखें।"] },
  Sadhana: { name: ["Sadhana", "साधना"], about: ["Accomplishment: the best day to begin a sadhana or important work.", "सिद्धि: साधना या महत्वपूर्ण कार्य आरम्भ करने का सर्वश्रेष्ठ दिन।"] },
  Naidhana: { name: ["Naidhana", "नैधन"], about: ["Danger: the hardest tara; rest, pray and postpone what can wait.", "संकट: सबसे कठिन तारा; विश्राम करें, प्रार्थना करें और जो टल सके उसे टालें।"] },
  Mitra: { name: ["Mitra", "मित्र"], about: ["A friend: help comes easily; meet people.", "मित्र: सहायता सहज मिलती है; लोगों से मिलें।"] },
  "Parama Mitra": { name: ["Parama Mitra", "परम मित्र"], about: ["The best friend: a very supportive day.", "परम मित्र: अत्यंत सहयोगी दिन।"] },
};

export const MUNTHA_HOUSE: Record<number, Pair> = {
  1: ["Health, confidence and a fresh start for the self.", "स्वास्थ्य, आत्मविश्वास और नई शुरुआत।"],
  2: ["Gains in wealth and good family ties.", "धन लाभ और पारिवारिक संबंधों में मधुरता।"],
  3: ["Courage, short journeys and success through effort.", "साहस, छोटी यात्राएँ और परिश्रम से सफलता।"],
  4: ["Care is needed at home; look after the mother and the mind.", "घर में सावधानी चाहिए; माता और मन का ध्यान रखें।"],
  5: ["Learning, children and creative work, with some ups and downs.", "विद्या, संतान और सृजन, कुछ उतार-चढ़ाव के साथ।"],
  6: ["Watch health and avoid disputes.", "स्वास्थ्य का ध्यान रखें और विवादों से बचें।"],
  7: ["Partnerships need patience; travel may tire you.", "साझेदारी में धैर्य चाहिए; यात्रा थका सकती है।"],
  8: ["A year for caution, inner work and protective sadhana.", "सावधानी, आंतरिक साधना और रक्षात्मक उपासना का वर्ष।"],
  9: ["Fortune, dharma and the guru's grace.", "भाग्य, धर्म और गुरु की कृपा।"],
  10: ["Rise in work, recognition and responsibility.", "कार्य में उन्नति, सम्मान और उत्तरदायित्व।"],
  11: ["Gains, wishes fulfilled and helpful friends.", "लाभ, इच्छापूर्ति और सहायक मित्र।"],
  12: ["Expenses and fatigue; good for retreat and spiritual practice.", "व्यय और थकान; एकांत और साधना के लिए अच्छा।"],
};

export const WESTERN_SIGN: Record<string, Pair> = {
  Aries: ["Bold, direct and quick to begin.", "साहसी, स्पष्ट और शीघ्र आरम्भ करने वाला।"],
  Taurus: ["Steady, sensual and loyal.", "स्थिर, सौन्दर्य-प्रेमी और निष्ठावान।"],
  Gemini: ["Curious, witty and changeable.", "जिज्ञासु, हाज़िरजवाब और परिवर्तनशील।"],
  Cancer: ["Caring, protective and moody.", "स्नेही, रक्षक और भावुक।"],
  Leo: ["Warm, proud and generous.", "उष्ण, स्वाभिमानी और उदार।"],
  Virgo: ["Precise, helpful and modest.", "सटीक, सहायक और विनम्र।"],
  Libra: ["Fair, charming and seeking balance.", "न्यायप्रिय, आकर्षक और संतुलन चाहने वाला।"],
  Scorpio: ["Intense, private and transforming.", "गहन, एकांतप्रिय और रूपांतरकारी।"],
  Sagittarius: ["Free, hopeful and seeking meaning.", "स्वतंत्र, आशावादी और अर्थ की खोज में।"],
  Capricorn: ["Patient, ambitious and dutiful.", "धैर्यवान, महत्वाकांक्षी और कर्तव्यनिष्ठ।"],
  Aquarius: ["Original, humane and detached.", "मौलिक, मानवतावादी और निर्लिप्त।"],
  Pisces: ["Gentle, dreamy and compassionate.", "कोमल, स्वप्निल और करुणामय।"],
};

export const ASPECT_HI: Record<string, string> = {
  conjunction: "युति", sextile: "षडाष्टक (60°)", square: "केंद्र (90°)", trine: "त्रिकोण (120°)", opposition: "प्रतियुति (180°)",
};
