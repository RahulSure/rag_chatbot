"""
Registry of web sources crawled into the vector store.

Each entry becomes `metadata.source_site` / `metadata.book_slug` on every chunk,
so a whole site can be re-crawled or removed in one step.
"""

from __future__ import annotations

WEB_SOURCES: list[dict] = [
    {
        "slug": "gurukripa",
        "name": "Gurukripa",
        "base": "https://gurukripa.org.in",
        "seeds": ["https://gurukripa.org.in/blog/sarv-devta/nikhileshwaranand-guru-deeksha"],
    },
    {
        "slug": "sidhashramkayogi",
        "name": "Siddhashram Ka Yogi",
        "base": "https://sidhashramkayogi.blogspot.com",
        "seeds": ["https://sidhashramkayogi.blogspot.com/p/blog-page_15.html"],
    },
    {
        "slug": "narayanduttshrimali-com",
        "name": "NarayanDuttShrimali.com",
        "base": "https://www.narayanduttshrimali.com",
        "seeds": [
            "https://www.narayanduttshrimali.com/paramhans-swami-nikhileshwaranand-ji",
            "https://www.narayanduttshrimali.com/divine-quotations-of-revered-by-gurudev",
        ],
    },
    {
        "slug": "nikhilmantravigyan",
        "name": "Nikhil Mantra Vigyan",
        "base": "https://nikhilmantravigyan.org",
        "seeds": ["https://nikhilmantravigyan.org/"],
        # The site serves a bot-protection challenge to automated clients. We do not
        # bypass that; add its content only with the owners' permission.
        "skip_reason": "site blocks automated access with a bot challenge",
    },
    {
        "slug": "taajmindpower",
        "name": "Taaj Mind Power",
        "base": "https://www.taajmindpower.com",
        "seeds": ["https://www.taajmindpower.com/sadguru-paramhans-swami-nikhileshwaranand-ji/"],
    },
    {
        "slug": "nikhil-siddhashram",
        "name": "Nikhil Siddhashram",
        "base": "https://nikhil-siddhashram.blogspot.com",
        "seeds": ["https://nikhil-siddhashram.blogspot.com/2015/06/nikhileshwaranand.html"],
    },
    {
        "slug": "shreedham108",
        "name": "Shreedham108",
        "base": "https://www.shreedham108.com",
        "seeds": ["https://www.shreedham108.com/"],
    },
    {
        "slug": "gurugamya",
        "name": "Gurugamya Anubhut Sadhanaye",
        "base": "https://gurugamyaanubhutsadhanaye.blogspot.com",
        "seeds": ["https://gurugamyaanubhutsadhanaye.blogspot.com/"],
    },
    # Remedy sources: switch words, Bach flower remedies and Reiki. The questions and the
    # answers are written into the posts themselves. Shown without the teacher's name
    # (rag/hide_names.py), and never listed as a source under an answer.
    {
        "slug": "reachonnaran",
        "name": "Switch Words",
        "base": "https://reachonnaran.com",
        "seeds": ["https://reachonnaran.com/tag/ask-naran/"],
        "remedy": True,
        "min_chars": 20,  # the weekly chanting posts are a single line of switch words
    },
    {
        "slug": "naransevents",
        "name": "Healing Workshops",
        "base": "https://naransevents.wordpress.com",
        "seeds": ["https://naransevents.wordpress.com/about/"],
        "remedy": True,
        "min_chars": 20,  # the weekly chanting posts are a single line of switch words
    },
    {
        "slug": "reachlotus",
        "name": "Life Is Easy",
        "base": "https://www.reachlotus.com",
        "seeds": ["https://www.reachlotus.com/blog/categories/life-is-easy-1"],
        "remedy": True,
        "min_chars": 20,  # the weekly chanting posts are a single line of switch words
        # Wix: the post body is server-rendered in this block; general extraction picks the sidebar instead.
        "content_selector": '[data-id="content-viewer"]',
        "title_selector": '[data-hook="post-title"]',
    },
]

SOURCES_BY_SLUG = {s["slug"]: s for s in WEB_SOURCES}
