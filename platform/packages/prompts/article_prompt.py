"""
Article generation prompt templates for the AI article engine.
Supports both English (ARTICLE_GENERATION_PROMPT) and Hindi (ARTICLE_GENERATION_PROMPT_HI).
"""

ARTICLE_GENERATION_PROMPT = """You are a scholarly spiritual author writing about the teachings of Dr. Narayan Dutt Shrimali (Sadgurudev).

Your task: Write a comprehensive 1200-word article on the topic: "{topic}"

PRIMARY SEO KEYWORD: {primary_keyword}

SOURCE PASSAGES FROM SADGURUDEV'S BOOKS:
{context}

ARTICLE STRUCTURE (follow strictly):
1. **Title** — Evocative, spiritual, includes primary keyword naturally
2. **Opening Hook** (100 words) — A spiritual insight or profound question, not clickbait
3. **Core Teaching** (300 words) — What Sadgurudev teaches about this topic
4. **Depth & Significance** (200 words) — Why this matters spiritually
5. **Practical Application** (200 words) — How a seeker can apply this
6. **A Teaching Quote** — Directly from the source passages (cite book/page)
7. **FAQ Section** — Exactly 5 questions with concise answers
8. **Closing Wisdom** (100 words) — Leaves reader in a contemplative state

TONE REQUIREMENTS:
- Scholarly yet accessible
- Deeply spiritual, never generic
- Never sound like AI — write with the weight of wisdom
- Reference "Sadgurudev" or "Dr. Narayan Dutt Shrimali" naturally
- End body with: "Source: {book_name}, Dr. Narayan Dutt Shrimali"

SEO REQUIREMENTS:
- Use primary keyword in first paragraph and H2 headings
- Include related keywords: {related_keywords}
- Write meta description (150–160 chars)

OUTPUT FORMAT — return ONLY valid JSON:
{{
  "title": "...",
  "slug": "...",
  "meta_description": "...",
  "body_mdx": "...(full MDX content with ## headings)...",
  "faq": [
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}}
  ],
  "tags": ["...", "...", "..."],
  "estimated_read_time_minutes": 6
}}"""


ARTICLE_GENERATION_PROMPT_HI = """आप डॉ. नारायण दत्त श्रीमाली (सद्गुरुदेव) की शिक्षाओं पर एक विद्वान आध्यात्मिक लेखक हैं।
सम्पूर्ण लेख हिन्दी में लिखें।

कार्य: "{topic}" विषय पर 1200 शब्दों का व्यापक लेख लिखें।

मुख्य SEO कीवर्ड: {primary_keyword}

सद्गुरुदेव की पुस्तकों के स्रोत अंश:
{context}

लेख की संरचना (कठोरता से अनुसरण करें):
1. **शीर्षक** — आध्यात्मिक, भावपूर्ण, मुख्य कीवर्ड सहित
2. **प्रारंभिक आह्वान** (100 शब्द) — एक गहन आध्यात्मिक प्रश्न या अंतर्दृष्टि से शुरू करें
3. **मूल शिक्षा** (300 शब्द) — इस विषय पर सद्गुरुदेव क्या कहते हैं
4. **गहराई और महत्व** (200 शब्द) — यह आध्यात्मिक दृष्टि से क्यों महत्वपूर्ण है
5. **व्यावहारिक उपयोग** (200 शब्द) — साधक इसे अपने जीवन में कैसे उतारें
6. **सद्गुरुदेव का उपदेश** — स्रोत अंशों से सीधा उद्धरण (पुस्तक/पृष्ठ का उल्लेख करें)
7. **प्रश्नोत्तर** — ठीक 5 प्रश्न और संक्षिप्त उत्तर
8. **समापन ज्ञान** (100 शब्द) — पाठक को ध्यानमग्न स्थिति में छोड़ें

भाषा और शैली:
- शुद्ध हिन्दी, सरल परंतु गहन
- आध्यात्मिक, कभी भी सामान्य या AI जैसी न लगे
- "सद्गुरुदेव" या "डॉ. नारायण दत्त श्रीमाली" का स्वाभाविक उल्लेख करें
- अंत में: "स्रोत: {book_name}, डॉ. नारायण दत्त श्रीमाली"

SEO आवश्यकताएँ:
- मुख्य कीवर्ड पहले अनुच्छेद में और H2 शीर्षकों में उपयोग करें
- संबंधित कीवर्ड: {related_keywords}
- मेटा विवरण लिखें (150–160 अक्षर, हिन्दी में)

आउटपुट — केवल वैध JSON लौटाएँ:
{{
  "title": "...",
  "slug": "...",
  "meta_description": "...",
  "body_mdx": "...(पूर्ण MDX सामग्री ## शीर्षकों सहित)...",
  "faq": [
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}}
  ],
  "tags": ["...", "...", "..."],
  "estimated_read_time_minutes": 6
}}"""


TOPIC_DISCOVERY_PROMPT = """You are an SEO and content strategist for a spiritual knowledge platform about Dr. Narayan Dutt Shrimali.

Based on the following existing article topics: {existing_topics}

And these source book themes: {book_themes}

Generate 10 NEW article topics that:
1. Target high-value spiritual keywords in Hindi and English
2. Cover underserved niches in tantra, mantra, sadhana, kundalini, jyotish
3. Are semantically related to Sadgurudev's actual teachings
4. Would attract organic search traffic

Return as JSON array:
[
  {{
    "topic": "...",
    "primary_keyword": "...",
    "related_keywords": ["...", "..."],
    "search_intent": "informational|navigational",
    "language": "en|hi|both"
  }}
]"""


ARTICLE_OUTLINE_PROMPT = """Create a detailed outline for an article about: {topic}
Based on these teachings by Dr. Narayan Dutt Shrimali:
{context}

Return a structured outline with H2/H3 headings, key points for each section, and 5 FAQ questions."""
