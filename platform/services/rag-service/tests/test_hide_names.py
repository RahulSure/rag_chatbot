"""The remedy teacher is never named: in stored text, titles or answers."""

from rag.hide_names import clean_title, drop_naming_sentences, hide_names


def test_bylines_speakers_and_mentions():
    post = ("Naran S Balakumar\nFatigue Buy Epsom salt.\nClient, June 14th\nWe are in love.\n"
            "Naran, June 15th\nChant ‘BEECH, WILLOW’.\nAs Naran sir says, chant daily. Naran's advice helps. "
            "Visit www.reachonnaran.com for more. Mail balakumar49@yahoo.com, or search on reachnaran.")
    out = hide_names(post)
    assert "naran" not in out.lower() and "balakumar" not in out.lower() and "@" not in out
    assert out.startswith("Fatigue")
    assert "Reply, June 15th" in out and "Client, June 14th" in out
    assert "As the teacher says" in out and "The teacher's advice" in out
    assert "‘BEECH, WILLOW’" in out


def test_other_spellings():
    out = hide_names("I attended the workshop of Narans Sir. Narangaru taught me. Naransir's teachings are simple.")
    assert "naran" not in out.lower()
    assert hide_names("Cinaraniria eye drops") == "Cinaraniria eye drops"


def test_narayan_is_untouched():
    text = "Dr. Narayan Dutt Shrimali taught this."
    assert hide_names(text) == text


def test_titles():
    assert clean_title("Naran Sri's This Week Chanting") == "This Week Chanting"
    assert clean_title("Ask Naran: Marriage delay") == "Marriage delay"
    assert clean_title("Gain Confidence") == "Gain Confidence"


def test_answers_drop_naming_sentences():
    answer = 'Chant "TOGETHER CHANGE ADJUST" daily. These practices are from Naran S. Balakumar’s teachings. Stay calm.'
    assert drop_naming_sentences(answer) == 'Chant "TOGETHER CHANGE ADJUST" daily. Stay calm.'
