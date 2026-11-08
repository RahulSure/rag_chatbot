"""Switch words are copied exactly: extraction from posts and the answer check. Run from services/rag-service:
    python -m pytest tests -q
"""

from rag.answer import Source, switch_word_spans, unverified_switch_words
from rag.switchwords import extract_switch_words

POST = ("When you feel so, chant the switch words ‘TOGETHER CHANGE ADJUST’. Burden means extra load. "
        "Also chant 'COUNT' daily, and \"TOGETHER CHANGE ADJUST\" again. Watch it on TV, 'OK'.")


def test_extraction_keeps_order_and_drops_repeats_and_noise():
    assert extract_switch_words(POST) == ["TOGETHER CHANGE ADJUST", "COUNT"]


def test_answer_spans_need_two_words():
    answer = 'Chant "TOGETHER CHANGE ADJUST" daily. Also ‘DIVINE COUNT’. A lone "OM" is not checked.'
    assert switch_word_spans(answer) == ["TOGETHER CHANGE ADJUST", "DIVINE COUNT"]


def test_only_invented_combinations_are_flagged():
    remedy = [Source("t", POST, True, remedy=True)]
    answer = 'Chant "TOGETHER CHANGE ADJUST" and "DIVINE COUNT".'
    assert unverified_switch_words(answer, remedy) == ["DIVINE COUNT"]


def test_nothing_is_checked_without_a_remedy_source():
    assert unverified_switch_words('Chant "DIVINE COUNT".', [Source("t", "x", True)]) == []


def test_unquoted_runs_are_checked_too():
    remedy = [Source("t", POST, True, remedy=True)]
    assert switch_word_spans("Chant TOGETHER CHANGE ADJUST and DIVINE COUNT daily.") == ["TOGETHER CHANGE ADJUST", "DIVINE COUNT"]
    assert unverified_switch_words("Chant TOGETHER CHANGE ADJUST and DIVINE COUNT daily.", remedy) == ["DIVINE COUNT"]
