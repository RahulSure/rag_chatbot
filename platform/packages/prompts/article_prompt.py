"""
Article generation prompt templates for the AI article engine.
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
