import json

import pytest

from build_index import (
    extract_md_prompts,
    extract_org_prompts,
    parse_prompt_pairs,
    extract_md_note_links,
    parse_md_metadata,
    build_index,
    extract_note_links,
    invert_links,
    parse_metadata,
    slug_of,
)


@pytest.mark.parametrize(
    "text, expected_title",
    [
        ("#+title: Plain Title\n\nBody", "Plain Title"),
        ("#+TITLE: Upper Case Key\n", "Upper Case Key"),
        ("#+title: #+title: Doubled Prefix\n", "Doubled Prefix"),
        ("No metadata at all", ""),
    ],
)
def test_parse_metadata_title(text, expected_title):
    assert parse_metadata(text)["title"] == expected_title, (
        "parse_metadata should extract the title, stripping a doubled #+title: prefix"
    )


@pytest.mark.parametrize(
    "text, expected_date",
    [
        ("#+date: <2024-05-20 23:10>\n", "2024-05-20"),
        ("#+date: 2022-10-08\n", "2022-10-08"),
        ("#+title: only title\n", ""),
    ],
)
def test_parse_metadata_date(text, expected_date):
    assert parse_metadata(text)["date"] == expected_date, (
        "parse_metadata should extract a YYYY-MM-DD date from org timestamps"
    )


@pytest.mark.parametrize(
    "text, expected_tags",
    [
        ("#+filetags: emacs repl clojure\n", ["emacs", "repl", "clojure"]),
        ("#+filetags: macos,keyboard,ua\n", ["macos", "keyboard", "ua"]),
        ("#+filetags: :a:b:\n", ["a", "b"]),
        ("#+title: none\n", []),
    ],
)
def test_parse_metadata_tags(text, expected_tags):
    assert parse_metadata(text)["tags"] == expected_tags, (
        "parse_metadata should split filetags on spaces, commas or colons"
    )


@pytest.mark.parametrize(
    "text, expected_links",
    [
        ("See [[file:other-note.org][other]].", ["other-note"]),
        ("Two: [[file:a.org][a]] and [[file:b.org]].", ["a", "b"]),
        ("External only: [[https://example.com][x]].", []),
        ("Image stays out: [[file:static/pic.gif]].", []),
        ("Repeated [[file:a.org][a]] and [[file:a.org][again]].", ["a"]),
    ],
)
def test_extract_note_links(text, expected_links):
    assert extract_note_links(text) == expected_links, (
        "extract_note_links should return unique slugs of file: links to .org notes only"
    )


def test_invert_links():
    graph = {"a": ["b", "c"], "b": ["c"], "c": []}
    assert invert_links(graph) == {"a": [], "b": ["a"], "c": ["a", "b"]}, (
        "invert_links should map every note to the sorted list of notes linking to it"
    )


@pytest.mark.parametrize(
    "filename, expected_slug",
    [
        ("programming-in-wartime.org", "programming-in-wartime"),
        ("notes/nested/deep.org", "deep"),
    ],
)
def test_slug_of(filename, expected_slug):
    assert slug_of(filename) == expected_slug, (
        "slug_of should return the bare filename without directories or extension"
    )


def test_build_index_end_to_end(tmp_path):
    (tmp_path / "a.org").write_text(
        "#+title: Note A\n#+date: <2024-01-01 10:00>\n#+filetags: x y\n\nLinks to [[file:b.org][B]].\n"
    )
    (tmp_path / "b.org").write_text("#+title: Note B\n\nNo links here.\n")

    index = build_index(tmp_path)

    assert set(index["notes"]) == {"a", "b"}, (
        "build_index should include every .org note keyed by slug"
    )
    assert index["notes"]["a"]["links"] == ["b"], (
        "build_index should record outgoing note links"
    )
    assert index["notes"]["b"]["backlinks"] == ["a"], (
        "build_index should record incoming backlinks"
    )
    assert index["notes"]["a"] == {
        "title": "Note A",
        "date": "2024-01-01",
        "tags": ["x", "y"],
        "file": "a.org",
        "links": ["b"],
        "prompts": [],
        "backlinks": [],
    }, "build_index should produce complete metadata per note"
    json.dumps(index)


@pytest.mark.parametrize(
    "text, expected",
    [
        (
            "---\ntitle: MD Note\ndate: 2026-07-29\ntags: [a, b]\n---\n\nBody",
            {"title": "MD Note", "date": "2026-07-29", "tags": ["a", "b"]},
        ),
        (
            "---\ntitle: Spaced Tags\ntags: x y\n---\n",
            {"title": "Spaced Tags", "date": "", "tags": ["x", "y"]},
        ),
        ("# Heading Title\n\nBody", {"title": "Heading Title", "date": "", "tags": []}),
        ("just prose", {"title": "", "date": "", "tags": []}),
    ],
)
def test_parse_md_metadata(text, expected):
    assert parse_md_metadata(text) == expected, (
        "parse_md_metadata should read YAML frontmatter or fall back to the first # heading"
    )


@pytest.mark.parametrize(
    "text, expected_links",
    [
        ("See [other](other-note.md).", ["other-note"]),
        ("Cross-format [org one](some.org) works.", ["some"]),
        ("External [x](https://example.com/a.md) ignored.", []),
        ("Image ![p](static/pic.gif) ignored.", []),
        ("Dupes [a](a.md) [a](a.md).", ["a"]),
    ],
)
def test_extract_md_note_links(text, expected_links):
    assert extract_md_note_links(text) == expected_links, (
        "extract_md_note_links should return unique slugs of relative .md/.org links"
    )


def test_org_links_reach_md_notes():
    assert extract_note_links("See [[file:md-note.md][md]].") == ["md-note"], (
        "extract_note_links should follow org file links to .md notes too"
    )


def test_build_index_mixed_formats(tmp_path):
    (tmp_path / "o.org").write_text("#+title: Org\n\n[[file:m.md][m]]\n")
    (tmp_path / "m.md").write_text("---\ntitle: Md\n---\n\n[back](o.org)\n")

    index = build_index(tmp_path)

    assert index["notes"]["o"]["file"] == "o.org", (
        "build_index should record each note's filename so the client knows the format"
    )
    assert index["notes"]["m"]["file"] == "m.md", (
        "build_index should index .md notes alongside .org"
    )
    assert index["notes"]["m"]["backlinks"] == ["o"], (
        "build_index should resolve org→md links into backlinks"
    )
    assert index["notes"]["o"]["backlinks"] == ["m"], (
        "build_index should resolve md→org links into backlinks"
    )


def test_build_index_rejects_slug_collision(tmp_path):
    (tmp_path / "same.org").write_text("#+title: A\n")
    (tmp_path / "same.md").write_text("---\ntitle: B\n---\n")

    with pytest.raises(ValueError, match="same"):
        build_index(tmp_path)


def test_build_index_drops_links_to_unknown_notes(tmp_path):
    (tmp_path / "a.org").write_text("#+title: A\n\n[[file:b.org][real]] [[file:ghost.org][gone]]\n")
    (tmp_path / "b.org").write_text("#+title: B\n")

    index = build_index(tmp_path)

    assert index["notes"]["a"]["links"] == ["b"], (
        "build_index should drop links pointing at notes that don't exist"
    )


@pytest.mark.parametrize(
    "body, expected",
    [
        ("Q: What?\nA: That.", [{"q": "What?", "a": "That."}]),
        (
            "Q: First?\nA: One.\nQ: Second?\nA: Two.",
            [{"q": "First?", "a": "One."}, {"q": "Second?", "a": "Two."}],
        ),
        (
            "Q: Multi\nline question?\nA: Multi\nline answer.",
            [{"q": "Multi\nline question?", "a": "Multi\nline answer."}],
        ),
        ("Q: Orphan question?", []),
        ("A: Orphan answer.", []),
        ("Q: Kept?\nA: Yes.\nQ: Dropped orphan?", [{"q": "Kept?", "a": "Yes."}]),
        ("", []),
    ],
)
def test_parse_prompt_pairs(body, expected):
    assert parse_prompt_pairs(body) == expected, (
        "parse_prompt_pairs should pair each Q with its A and drop orphans of either kind"
    )


@pytest.mark.parametrize(
    "text, expected",
    [
        (
            "#+title: x\n\n#+begin_test\nQ: What?\nA: That.\n#+end_test\n",
            [{"q": "What?", "a": "That."}],
        ),
        (
            "#+BEGIN_TEST\nQ: Upper?\nA: Also works.\n#+END_TEST",
            [{"q": "Upper?", "a": "Also works."}],
        ),
        (
            "#+begin_test\nQ: One?\nA: 1.\n#+end_test\ntext between\n#+begin_test\nQ: Two?\nA: 2.\n#+end_test",
            [{"q": "One?", "a": "1."}, {"q": "Two?", "a": "2."}],
        ),
        ("#+begin_src python\nQ = 1\n#+end_src", []),
        ("Plain note, no blocks.", []),
    ],
)
def test_extract_org_prompts(text, expected):
    assert extract_org_prompts(text) == expected, (
        "extract_org_prompts should collect Q/A pairs from every #+begin_test block, case-insensitively"
    )


@pytest.mark.parametrize(
    "text, expected",
    [
        ("```test\nQ: What?\nA: That.\n```", [{"q": "What?", "a": "That."}]),
        ("```python\nQ = 1\n```", []),
        (
            "```test\nQ: One?\nA: 1.\n```\nprose\n```test\nQ: Two?\nA: 2.\n```",
            [{"q": "One?", "a": "1."}, {"q": "Two?", "a": "2."}],
        ),
    ],
)
def test_extract_md_prompts(text, expected):
    assert extract_md_prompts(text) == expected, (
        "extract_md_prompts should collect Q/A pairs only from fenced blocks tagged test"
    )


def test_build_index_includes_prompts(tmp_path):
    (tmp_path / "quizzy.org").write_text(
        "#+title: Quizzy\n\n#+begin_test\nQ: What?\nA: That.\n#+end_test\n"
    )
    (tmp_path / "plain.org").write_text("#+title: Plain\n")
    index = build_index(tmp_path)
    assert index["notes"]["quizzy"]["prompts"] == [{"q": "What?", "a": "That."}], (
        "build_index should carry extracted prompts into the note entry"
    )
    assert index["notes"]["plain"]["prompts"] == [], (
        "build_index should give promptless notes an empty prompts list"
    )
